/**
 * Deepgram 语音转文字 (STT) 服务
 * 使用 nova-2 模型，支持中文、英文等多语言
 */

import { createClient, type PrerecordedSchema } from '@deepgram/sdk';
import { readAudioFile, getAudioMimeType } from '../utils/audio.js';
import { getConfig, type STTConfig } from '../config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('STT');

// ── 类型定义 ────────────────────────────────────────────────

export interface Utterance {
  start: number;       // 开始时间（秒）
  end: number;         // 结束时间（秒）
  transcript: string;  // 转写文本
  confidence: number;  // 置信度
  speaker?: number;    // 说话人编号（开启 diarize 时）
}

export interface STTResult {
  /** 原始转写全文（保留原始口语记录） */
  rawTranscript: string;
  /** 按段落拆分 */
  paragraphs: string[];
  /** 按语义单元拆分（含时间戳） */
  utterances: Utterance[];
  /** 平均置信度 (0-1) */
  confidence: number;
  /** 音频时长（秒） */
  duration: number;
  /** 处理元数据 */
  metadata: {
    model: string;
    language: string;
    processedAt: string;
    audioFile: string;
  };
}

// ── 服务实现 ────────────────────────────────────────────────

/**
 * 转写本地音频文件
 *
 * @param audioFilePath 音频文件路径（支持 wav/mp3/m4a/ogg/webm/flac）
 * @param configOverrides 可选的配置覆盖（例如临时切换语言）
 * @returns STT 转写结果
 */
export async function transcribeFile(
  audioFilePath: string,
  configOverrides?: Partial<STTConfig>,
): Promise<STTResult> {
  const config = getConfig();
  const sttConfig = { ...config.pipeline.stt, ...configOverrides };

  log.step(`开始转写: ${audioFilePath}`);
  log.metric('模型', sttConfig.model);
  log.metric('语言', sttConfig.language);

  const startTime = Date.now();

  // 初始化 Deepgram 客户端
  const deepgram = createClient(config.deepgramApiKey);

  // 读取音频文件
  const audioBuffer = readAudioFile(audioFilePath);
  const mimeType = getAudioMimeType(audioFilePath);

  // 构建请求参数
  const options: PrerecordedSchema = {
    model: sttConfig.model,
    language: sttConfig.language,
    smart_format: sttConfig.options.smart_format,
    punctuate: sttConfig.options.punctuate,
    paragraphs: sttConfig.options.paragraphs,
    utterances: sttConfig.options.utterances,
    diarize: sttConfig.options.diarize,
  };

  log.debug('Deepgram 请求参数', options);

  // 调用 API
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    options,
  );

  if (error) {
    log.error('Deepgram API 调用失败', error);
    throw new Error(`Deepgram STT 失败: ${JSON.stringify(error)}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 解析结果
  const channel = result.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative) {
    throw new Error('Deepgram 返回了空结果，请检查音频文件是否有效');
  }

  // 提取原始转写
  const rawTranscript = alternative.transcript || '';

  // 提取段落
  const paragraphs: string[] = [];
  const paragraphData = alternative.paragraphs?.paragraphs;
  if (paragraphData) {
    for (const para of paragraphData) {
      const sentences = para.sentences?.map(s => s.text).join('') || '';
      if (sentences.trim()) {
        paragraphs.push(sentences.trim());
      }
    }
  }
  // 如果没有段落数据，用全文作为单段
  if (paragraphs.length === 0 && rawTranscript) {
    paragraphs.push(rawTranscript);
  }

  // 提取语义分段
  const utterances: Utterance[] = [];
  if (result.results?.utterances) {
    for (const utt of result.results.utterances) {
      utterances.push({
        start: utt.start,
        end: utt.end,
        transcript: utt.transcript,
        confidence: utt.confidence,
        speaker: utt.speaker,
      });
    }
  }

  // 计算平均置信度
  const confidence = alternative.confidence || 0;

  // 音频时长
  const duration = result.metadata?.duration || 0;

  const sttResult: STTResult = {
    rawTranscript,
    paragraphs,
    utterances,
    confidence,
    duration,
    metadata: {
      model: sttConfig.model,
      language: sttConfig.language,
      processedAt: new Date().toISOString(),
      audioFile: audioFilePath,
    },
  };

  // 打印结果摘要
  log.divider('STT 转写结果');
  log.metric('耗时', elapsed, 's');
  log.metric('音频时长', duration.toFixed(1), 's');
  log.metric('置信度', `${(confidence * 100).toFixed(1)}%`);
  log.metric('段落数', paragraphs.length);
  log.metric('语义分段数', utterances.length);
  log.success('转写文本', rawTranscript);

  return sttResult;
}

/**
 * 批量转写多个音频文件
 *
 * @param audioFilePaths 音频文件路径数组
 * @param configOverrides 可选的配置覆盖
 * @returns 每个文件的转写结果
 */
export async function transcribeMultipleFiles(
  audioFilePaths: string[],
  configOverrides?: Partial<STTConfig>,
): Promise<STTResult[]> {
  log.divider(`批量转写 ${audioFilePaths.length} 个文件`);

  const results: STTResult[] = [];
  for (let i = 0; i < audioFilePaths.length; i++) {
    log.step(`[${i + 1}/${audioFilePaths.length}] 处理中...`);
    const result = await transcribeFile(audioFilePaths[i], configOverrides);
    results.push(result);
  }

  log.success(`全部转写完成: ${results.length} 个文件`);
  return results;
}
