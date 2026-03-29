/**
 * Gemini TTS 文字转语音服务
 * 使用 gemini-2.5-flash-preview-tts 模型
 * 输出 WAV 格式音频文件
 */

import { GoogleGenAI } from '@google/genai';
import { getConfig } from '../config.js';
import { savePcmAsWav, generateOutputFilename } from '../utils/audio.js';
import { createLogger } from '../utils/logger.js';
import { resolve } from 'path';

const log = createLogger('TTS');

// ── 类型定义 ────────────────────────────────────────────────

export interface TTSResult {
  /** 输出 WAV 文件路径 */
  audioPath: string;
  /** 输入文本 */
  inputText: string;
  /** 文本字数 */
  textLength: number;
  /** 使用的声音 */
  voiceName: string;
  /** 使用的模型 */
  model: string;
  /** 处理耗时(ms) */
  elapsedMs: number;
}

// ── 服务实现 ────────────────────────────────────────────────

/**
 * 将文本转换为语音并保存为 WAV 文件
 *
 * @param text        要朗读的文本
 * @param outputPath  可选的输出文件路径（不指定则自动生成）
 * @returns TTS 处理结果
 */
export async function textToSpeech(
  text: string,
  outputPath?: string,
): Promise<TTSResult> {
  const config = getConfig();
  const ttsConfig = config.pipeline.tts;

  log.step('开始文字转语音...');
  log.metric('模型', ttsConfig.model);
  log.metric('声音', ttsConfig.voiceName);
  log.metric('文本字数', text.length, '字');

  const startTime = Date.now();

  // 初始化 Gemini 客户端
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  // 构建 TTS 请求
  // 将朗读风格指令和文本组合成 content
  const ttsPrompt = `${ttsConfig.speakingStyle}\n\n请朗读以下文本：\n\n${text}`;

  const response = await ai.models.generateContent({
    model: ttsConfig.model,
    contents: [
      {
        role: 'user',
        parts: [{ text: ttsPrompt }],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: ttsConfig.voiceName,
          },
        },
      },
    },
  });

  // 提取音频数据
  const candidate = response.candidates?.[0];
  const audioPart = candidate?.content?.parts?.[0];

  if (!audioPart?.inlineData?.data) {
    log.error('TTS 返回数据为空');
    log.debug('完整响应', JSON.stringify(response, null, 2));
    throw new Error('Gemini TTS 未返回音频数据，请检查模型和请求参数');
  }

  const audioBase64 = audioPart.inlineData.data;

  // 确定输出路径
  const finalPath = outputPath || resolve(
    config.pipeline.output.dir,
    generateOutputFilename('tts', '.wav'),
  );

  // 保存为 WAV 文件
  savePcmAsWav(
    finalPath,
    audioBase64,
    ttsConfig.sampleRate,
    ttsConfig.channels,
    ttsConfig.bitDepth,
  );

  const elapsed = Date.now() - startTime;

  log.success(`TTS 完成 (${elapsed}ms)`);
  log.metric('输出文件', finalPath);

  return {
    audioPath: finalPath,
    inputText: text,
    textLength: text.length,
    voiceName: ttsConfig.voiceName,
    model: ttsConfig.model,
    elapsedMs: elapsed,
  };
}

/**
 * 将长文本分段进行 TTS（用于超长文本）
 *
 * Gemini TTS 可能对单次请求的文本长度有限制，
 * 此函数自动将长文本按段落拆分，逐段生成音频后合并
 *
 * @param text        完整文本
 * @param outputPath  输出文件路径
 * @param maxChunkLength  每段最大字数（默认 500）
 * @returns TTS 结果
 */
export async function textToSpeechLong(
  text: string,
  outputPath?: string,
  maxChunkLength: number = 500,
): Promise<TTSResult> {
  // 如果文本不长，直接处理
  if (text.length <= maxChunkLength) {
    return textToSpeech(text, outputPath);
  }

  log.info(`文本较长 (${text.length} 字)，将分段处理...`);

  // 按段落或句号分割
  const sentences = text.split(/(?<=[。！？.!?\n])/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  log.metric('分段数', chunks.length);

  // 逐段生成 TTS 并收集音频数据
  const config = getConfig();
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const ttsConfig = config.pipeline.tts;
  const startTime = Date.now();
  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    log.step(`生成第 ${i + 1}/${chunks.length} 段音频...`);

    const ttsPrompt = `${ttsConfig.speakingStyle}\n\n请朗读以下文本：\n\n${chunks[i]}`;

    const response = await ai.models.generateContent({
      model: ttsConfig.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: ttsPrompt }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ttsConfig.voiceName,
            },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
      audioBuffers.push(Buffer.from(audioPart.inlineData.data, 'base64'));
    } else {
      log.warn(`第 ${i + 1} 段 TTS 未返回音频数据，跳过`);
    }
  }

  // 合并所有音频数据
  const mergedAudio = Buffer.concat(audioBuffers);

  const finalPath = outputPath || resolve(
    config.pipeline.output.dir,
    generateOutputFilename('tts-long', '.wav'),
  );

  savePcmAsWav(
    finalPath,
    mergedAudio,
    ttsConfig.sampleRate,
    ttsConfig.channels,
    ttsConfig.bitDepth,
  );

  const elapsed = Date.now() - startTime;

  log.success(`长文本 TTS 完成 (${elapsed}ms)，共 ${chunks.length} 段`);

  return {
    audioPath: finalPath,
    inputText: text,
    textLength: text.length,
    voiceName: ttsConfig.voiceName,
    model: ttsConfig.model,
    elapsedMs: elapsed,
  };
}
