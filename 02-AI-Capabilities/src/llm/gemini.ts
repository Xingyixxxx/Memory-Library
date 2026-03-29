/**
 * Gemini LLM 文案润色服务
 * 提供单条照片文案润色 + 多条文案融合总结
 */

import { GoogleGenAI } from '@google/genai';
import { getConfig, calculateTargetSummaryLength } from '../config.js';
import { getPrompts, type EventMeta } from './prompts.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('LLM');

// ── 类型定义 ────────────────────────────────────────────────

export interface PhotoTextResult {
  /** 润色后的照片文案 */
  polishedText: string;
  /** 原始转写文本 */
  originalTranscript: string;
  /** 照片索引 */
  photoIndex: number;
  /** LLM 模型 */
  model: string;
  /** 处理耗时(ms) */
  elapsedMs: number;
}

export interface SummaryResult {
  /** 事件总结散文 */
  summaryText: string;
  /** 所有照片文案 */
  photoTexts: string[];
  /** 目标字数 */
  targetChars: number;
  /** 实际字数 */
  actualChars: number;
  /** 预估朗读时间（秒） */
  estimatedReadingSeconds: number;
  /** 用户感悟（如有） */
  userThoughts?: string;
  /** LLM 模型 */
  model: string;
  /** 处理耗时(ms) */
  elapsedMs: number;
}

// ── 内部工具 ────────────────────────────────────────────────

function createGeminiClient(): GoogleGenAI {
  const config = getConfig();
  return new GoogleGenAI({ apiKey: config.geminiApiKey });
}

// ── 服务实现 ────────────────────────────────────────────────

/**
 * 润色单条照片文案
 *
 * @param transcript  STT 原始转写文本
 * @param photoIndex  照片索引（用于日志）
 * @returns 润色后的照片文案
 */
export async function polishPhotoText(
  transcript: string,
  photoIndex: number = 0,
): Promise<PhotoTextResult> {
  const config = getConfig();
  const llmConfig = config.pipeline.llm;
  const prompts = getPrompts(llmConfig.language);

  log.step(`润色照片 #${photoIndex + 1} 文案...`);

  const startTime = Date.now();
  const ai = createGeminiClient();

  const userPrompt = prompts.userPromptSinglePhoto(
    transcript,
    llmConfig.photoText.maxLength,
  );

  const response = await ai.models.generateContent({
    model: llmConfig.model,
    contents: userPrompt,
    config: {
      systemInstruction: prompts.systemPromptSinglePhoto,
      temperature: llmConfig.temperature,
      maxOutputTokens: llmConfig.maxOutputTokens,
    },
  });

  const polishedText = response.text?.trim() || '';
  const elapsed = Date.now() - startTime;

  log.success(`照片 #${photoIndex + 1} 润色完成 (${elapsed}ms)`);
  log.info('原文', transcript);
  log.info('润色后', polishedText);

  return {
    polishedText,
    originalTranscript: transcript,
    photoIndex,
    model: llmConfig.model,
    elapsedMs: elapsed,
  };
}

/**
 * 批量润色多条照片文案
 *
 * @param transcripts  多条 STT 原始转写文本
 * @returns 每条的润色结果
 */
export async function polishMultiplePhotoTexts(
  transcripts: string[],
): Promise<PhotoTextResult[]> {
  log.divider(`批量润色 ${transcripts.length} 条照片文案`);

  const results: PhotoTextResult[] = [];
  for (let i = 0; i < transcripts.length; i++) {
    const result = await polishPhotoText(transcripts[i], i);
    results.push(result);
  }

  log.success(`全部润色完成: ${results.length} 条`);
  return results;
}

/**
 * 生成事件总结散文
 *
 * 将多张照片的文案融合成一篇连贯的散文，适合 TTS 朗读
 *
 * @param photoTexts    所有照片的润色文案
 * @param options       总结选项
 * @returns 事件总结散文
 */
export async function generateSummary(
  photoTexts: string[],
  options?: {
    /** 用户自己的感悟/总结提示，帮助 LLM 理解中心思想 */
    userThoughts?: string;
    /** 事件元数据 */
    eventMeta?: EventMeta;
    /** 手动指定目标字数（不设则自动根据照片数量计算） */
    targetChars?: number;
  },
): Promise<SummaryResult> {
  const config = getConfig();
  const llmConfig = config.pipeline.llm;
  const prompts = getPrompts(llmConfig.language);

  if (!llmConfig.summary.enabled) {
    log.warn('总结功能已在配置中禁用 (llm.summary.enabled = false)');
    return {
      summaryText: '',
      photoTexts,
      targetChars: 0,
      actualChars: 0,
      estimatedReadingSeconds: 0,
      model: llmConfig.model,
      elapsedMs: 0,
    };
  }

  const targetChars = options?.targetChars || calculateTargetSummaryLength(photoTexts.length);

  log.divider('生成事件总结散文');
  log.metric('照片数量', photoTexts.length);
  log.metric('目标字数', targetChars, '字');
  log.metric('预估朗读时间', `${(targetChars / llmConfig.summary.charsPerMinute).toFixed(1)}`, '分钟');

  if (options?.userThoughts) {
    log.info('用户感悟', options.userThoughts);
  }

  const startTime = Date.now();
  const ai = createGeminiClient();

  const userPrompt = prompts.userPromptSummary(
    photoTexts,
    targetChars,
    options?.userThoughts,
    options?.eventMeta,
  );

  const response = await ai.models.generateContent({
    model: llmConfig.model,
    contents: userPrompt,
    config: {
      systemInstruction: prompts.systemPromptSummary,
      temperature: llmConfig.temperature,
      maxOutputTokens: llmConfig.maxOutputTokens,
    },
  });

  const summaryText = response.text?.trim() || '';
  const elapsed = Date.now() - startTime;
  const actualChars = summaryText.length;
  const estimatedReadingSeconds = (actualChars / llmConfig.summary.charsPerMinute) * 60;

  log.success(`总结生成完成 (${elapsed}ms)`);
  log.metric('实际字数', actualChars, '字');
  log.metric('预估朗读时间', `${(estimatedReadingSeconds / 60).toFixed(1)}`, '分钟');
  log.info('总结文本', summaryText);

  return {
    summaryText,
    photoTexts,
    targetChars,
    actualChars,
    estimatedReadingSeconds,
    userThoughts: options?.userThoughts,
    model: llmConfig.model,
    elapsedMs: elapsed,
  };
}
