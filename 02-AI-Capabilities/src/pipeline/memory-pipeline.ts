/**
 * 记忆管道 — 完整数据处理编排
 *
 * 将 STT → LLM 润色 → LLM 总结 → TTS 串联为一条完整的数据管道
 * 支持中间结果保存和处理报告生成
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { transcribeFile, type STTResult } from '../stt/deepgram.js';
import { polishPhotoText, generateSummary, type PhotoTextResult, type SummaryResult } from '../llm/gemini.js';
import { textToSpeechLong, type TTSResult } from '../tts/gemini-tts.js';
import { getConfig, PROJECT_ROOT } from '../config.js';
import { ensureOutputDir, generateOutputFilename } from '../utils/audio.js';
import { createLogger } from '../utils/logger.js';
import type { EventMeta } from '../llm/prompts.js';

const log = createLogger('Pipeline');

// ── 类型定义 ────────────────────────────────────────────────

export interface PipelineInput {
  /** 音频文件路径数组（每段录音对应一张照片的描述） */
  audioFiles: string[];
  /** 事件元数据（可选） */
  eventMeta?: EventMeta;
  /** 用户的感悟/总结提示（可选，传递给 LLM 帮助理解中心思想） */
  userThoughts?: string;
  /** 是否生成总结散文（默认跟随配置文件） */
  enableSummary?: boolean;
  /** 是否生成 TTS 朗读音频（默认 true） */
  enableTTS?: boolean;
}

export interface PipelineOutput {
  /** 每段录音的 STT 转写结果 */
  sttResults: STTResult[];
  /** 每段录音的润色文案结果 */
  photoTextResults: PhotoTextResult[];
  /** 事件总结散文结果（如开启） */
  summaryResult?: SummaryResult;
  /** TTS 朗读音频结果（如开启） */
  ttsResult?: TTSResult;
  /** 完整处理日志 */
  processingSteps: ProcessingStep[];
  /** 处理报告路径（如开启报告生成） */
  reportPath?: string;
  /** 总耗时(ms) */
  totalElapsedMs: number;
}

export interface ProcessingStep {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  elapsedMs: number;
  details?: string;
}

// ── 管道实现 ────────────────────────────────────────────────

/**
 * 执行完整的记忆处理管道
 *
 * 流程：
 * 1. 遍历音频 → Deepgram STT 转写
 * 2. 每条转写 → Gemini LLM 单条润色
 * 3. 所有润色文案 → Gemini LLM 生成事件总结（可选）
 * 4. 总结文案 → Gemini TTS 生成朗读音频（可选）
 * 5. 保存中间结果 + 生成处理报告
 *
 * @param input 管道输入
 * @returns 管道完整输出
 */
export async function runMemoryPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const config = getConfig();
  const outputDir = config.pipeline.output.dir;
  ensureOutputDir(outputDir);

  const startTime = Date.now();
  const steps: ProcessingStep[] = [];

  log.divider('🚀 记忆管道启动');
  log.metric('音频文件', input.audioFiles.length, '个');
  if (input.eventMeta?.title) log.metric('事件', input.eventMeta.title);
  if (input.userThoughts) log.metric('用户感悟', '已提供');

  // ────────────────────────────────────────────────
  // Step 1: STT 转写
  // ────────────────────────────────────────────────
  log.divider('Step 1: 语音转文字 (STT)');
  const sttResults: STTResult[] = [];

  for (let i = 0; i < input.audioFiles.length; i++) {
    const stepStart = Date.now();
    try {
      log.step(`[${i + 1}/${input.audioFiles.length}] 转写: ${basename(input.audioFiles[i])}`);
      const result = await transcribeFile(input.audioFiles[i]);
      sttResults.push(result);
      steps.push({
        step: `STT - ${basename(input.audioFiles[i])}`,
        status: 'success',
        elapsedMs: Date.now() - stepStart,
        details: `置信度: ${(result.confidence * 100).toFixed(1)}%`,
      });
    } catch (error) {
      log.error(`转写失败: ${input.audioFiles[i]}`, error);
      steps.push({
        step: `STT - ${basename(input.audioFiles[i])}`,
        status: 'failed',
        elapsedMs: Date.now() - stepStart,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ────────────────────────────────────────────────
  // Step 2: LLM 单条润色
  // ────────────────────────────────────────────────
  log.divider('Step 2: 照片文案润色 (LLM)');
  const photoTextResults: PhotoTextResult[] = [];

  for (let i = 0; i < sttResults.length; i++) {
    const stepStart = Date.now();
    try {
      const result = await polishPhotoText(sttResults[i].rawTranscript, i);
      photoTextResults.push(result);
      steps.push({
        step: `LLM Polish - 照片 #${i + 1}`,
        status: 'success',
        elapsedMs: Date.now() - stepStart,
        details: `${result.polishedText.length} 字`,
      });
    } catch (error) {
      log.error(`润色失败: 照片 #${i + 1}`, error);
      steps.push({
        step: `LLM Polish - 照片 #${i + 1}`,
        status: 'failed',
        elapsedMs: Date.now() - stepStart,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ────────────────────────────────────────────────
  // Step 3: LLM 事件总结（可选）
  // ────────────────────────────────────────────────
  const enableSummary = input.enableSummary ?? config.pipeline.llm.summary.enabled;
  let summaryResult: SummaryResult | undefined;

  if (enableSummary && photoTextResults.length > 0) {
    log.divider('Step 3: 事件总结散文 (LLM)');
    const stepStart = Date.now();
    try {
      const photoTexts = photoTextResults.map(r => r.polishedText);
      summaryResult = await generateSummary(photoTexts, {
        userThoughts: input.userThoughts,
        eventMeta: input.eventMeta,
      });
      steps.push({
        step: 'LLM Summary',
        status: 'success',
        elapsedMs: Date.now() - stepStart,
        details: `${summaryResult.actualChars} 字 / 预估 ${(summaryResult.estimatedReadingSeconds / 60).toFixed(1)} 分钟`,
      });
    } catch (error) {
      log.error('总结生成失败', error);
      steps.push({
        step: 'LLM Summary',
        status: 'failed',
        elapsedMs: Date.now() - stepStart,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    steps.push({
      step: 'LLM Summary',
      status: 'skipped',
      elapsedMs: 0,
      details: enableSummary ? '无可用照片文案' : '用户选择跳过',
    });
  }

  // ────────────────────────────────────────────────
  // Step 4: TTS 朗读音频（可选）
  // ────────────────────────────────────────────────
  const enableTTS = input.enableTTS ?? true;
  let ttsResult: TTSResult | undefined;

  if (enableTTS && summaryResult?.summaryText) {
    log.divider('Step 4: 文字转语音 (TTS)');
    const stepStart = Date.now();
    try {
      const ttsOutputPath = resolve(outputDir, generateOutputFilename('narration', '.wav'));
      ttsResult = await textToSpeechLong(summaryResult.summaryText, ttsOutputPath);
      steps.push({
        step: 'TTS',
        status: 'success',
        elapsedMs: Date.now() - stepStart,
        details: `输出: ${basename(ttsResult.audioPath)}`,
      });
    } catch (error) {
      log.error('TTS 生成失败', error);
      steps.push({
        step: 'TTS',
        status: 'failed',
        elapsedMs: Date.now() - stepStart,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    steps.push({
      step: 'TTS',
      status: 'skipped',
      elapsedMs: 0,
      details: !enableTTS ? '用户选择跳过' : '无总结文案可朗读',
    });
  }

  const totalElapsedMs = Date.now() - startTime;

  // ────────────────────────────────────────────────
  // 保存中间结果 & 生成报告
  // ────────────────────────────────────────────────
  const output: PipelineOutput = {
    sttResults,
    photoTextResults,
    summaryResult,
    ttsResult,
    processingSteps: steps,
    totalElapsedMs,
  };

  if (config.pipeline.output.saveIntermediateResults) {
    saveIntermediateResults(output, outputDir);
  }

  if (config.pipeline.output.generateReport) {
    output.reportPath = generateReport(output, outputDir);
  }

  // 最终总结
  log.divider('✨ 管道执行完成');
  log.metric('总耗时', `${(totalElapsedMs / 1000).toFixed(1)}`, 's');
  log.metric('成功步骤', steps.filter(s => s.status === 'success').length);
  log.metric('失败步骤', steps.filter(s => s.status === 'failed').length);
  log.metric('跳过步骤', steps.filter(s => s.status === 'skipped').length);

  if (output.reportPath) {
    log.info(`处理报告: ${output.reportPath}`);
  }

  return output;
}

// ── 中间结果保存 ─────────────────────────────────────────────

function saveIntermediateResults(output: PipelineOutput, outputDir: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // 保存 STT 结果
  if (output.sttResults.length > 0) {
    const sttPath = resolve(outputDir, `stt-results_${timestamp}.json`);
    writeFileSync(sttPath, JSON.stringify(output.sttResults, null, 2), 'utf-8');
    log.debug(`STT 结果已保存: ${basename(sttPath)}`);
  }

  // 保存润色文案
  if (output.photoTextResults.length > 0) {
    const textsPath = resolve(outputDir, `photo-texts_${timestamp}.json`);
    writeFileSync(textsPath, JSON.stringify(output.photoTextResults, null, 2), 'utf-8');
    log.debug(`润色文案已保存: ${basename(textsPath)}`);
  }

  // 保存总结散文（纯文本）
  if (output.summaryResult?.summaryText) {
    const summaryPath = resolve(outputDir, `summary_${timestamp}.txt`);
    writeFileSync(summaryPath, output.summaryResult.summaryText, 'utf-8');
    log.debug(`总结散文已保存: ${basename(summaryPath)}`);
  }
}

// ── 处理报告生成 ─────────────────────────────────────────────

function generateReport(output: PipelineOutput, outputDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = resolve(outputDir, `report_${timestamp}.md`);

  const totalSeconds = output.totalElapsedMs / 1000;
  const successCount = output.processingSteps.filter(s => s.status === 'success').length;
  const failedCount = output.processingSteps.filter(s => s.status === 'failed').length;

  let report = `# 📊 Memory Pipeline Report

**生成时间**: ${new Date().toLocaleString('zh-CN')}

## 📈 概览

| 指标 | 数值 |
|------|------|
| ⏱️ 总耗时 | ${totalSeconds.toFixed(1)}s |
| 🎙️ 处理音频 | ${output.sttResults.length} 段 |
| ✅ 成功步骤 | ${successCount} |
| ❌ 失败步骤 | ${failedCount} |
`;

  // STT 结果
  if (output.sttResults.length > 0) {
    const avgConfidence = output.sttResults.reduce((sum, r) => sum + r.confidence, 0) / output.sttResults.length;
    const totalDuration = output.sttResults.reduce((sum, r) => sum + r.duration, 0);

    report += `
## 🎙️ STT 转写

| 指标 | 数值 |
|------|------|
| 音频总时长 | ${totalDuration.toFixed(1)}s |
| 平均置信度 | ${(avgConfidence * 100).toFixed(1)}% |

### 各文件转写结果

`;

    for (const stt of output.sttResults) {
      report += `**${basename(stt.metadata.audioFile)}** (${stt.duration.toFixed(1)}s, 置信度 ${(stt.confidence * 100).toFixed(1)}%)\n`;
      report += `> ${stt.rawTranscript.slice(0, 100)}${stt.rawTranscript.length > 100 ? '...' : ''}\n\n`;
    }
  }

  // 润色结果
  if (output.photoTextResults.length > 0) {
    report += `## ✨ 照片文案润色\n\n`;
    for (const pt of output.photoTextResults) {
      report += `**照片 #${pt.photoIndex + 1}** (${pt.elapsedMs}ms)\n`;
      report += `- 原文: ${pt.originalTranscript.slice(0, 50)}${pt.originalTranscript.length > 50 ? '...' : ''}\n`;
      report += `- 润色: ${pt.polishedText}\n\n`;
    }
  }

  // 总结结果
  if (output.summaryResult?.summaryText) {
    report += `## 📖 事件总结散文

| 指标 | 数值 |
|------|------|
| 目标字数 | ${output.summaryResult.targetChars} 字 |
| 实际字数 | ${output.summaryResult.actualChars} 字 |
| 预估朗读 | ${(output.summaryResult.estimatedReadingSeconds / 60).toFixed(1)} 分钟 |

${output.summaryResult.userThoughts ? `**用户感悟**: ${output.summaryResult.userThoughts}\n` : ''}

> ${output.summaryResult.summaryText}

`;
  }

  // TTS 结果
  if (output.ttsResult) {
    report += `## 🔊 TTS 朗读音频

| 指标 | 数值 |
|------|------|
| 声音 | ${output.ttsResult.voiceName} |
| 输出文件 | ${basename(output.ttsResult.audioPath)} |
| 耗时 | ${output.ttsResult.elapsedMs}ms |

`;
  }

  // 处理步骤明细
  report += `## 📋 处理步骤明细

| 步骤 | 状态 | 耗时 | 详情 |
|------|------|------|------|
`;
  for (const step of output.processingSteps) {
    const statusIcon = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
    report += `| ${step.step} | ${statusIcon} ${step.status} | ${step.elapsedMs}ms | ${step.details || '-'} |\n`;
  }

  writeFileSync(reportPath, report, 'utf-8');
  log.success(`处理报告已生成: ${basename(reportPath)}`);

  return reportPath;
}
