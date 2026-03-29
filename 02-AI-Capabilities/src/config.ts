/**
 * 统一配置加载与验证
 * 从 .env 加载 API 密钥，从 pipeline.config.json 加载管道参数
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ── 路径常量 ───────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = resolve(__dirname, '..');

// ── 加载 .env ──────────────────────────────────────────────
dotenv.config({ path: resolve(PROJECT_ROOT, '.env') });

// ── 类型定义 ────────────────────────────────────────────────

export interface STTConfig {
  provider: string;
  model: string;
  language: string;
  options: {
    smart_format: boolean;
    punctuate: boolean;
    paragraphs: boolean;
    utterances: boolean;
    diarize: boolean;
  };
}

export interface LLMPhotoTextConfig {
  maxLength: number;
  typicalLength: number;
  style: string;
}

export interface LLMSummaryConfig {
  enabled: boolean;
  targetReadingMinutes: { min: number; max: number };
  charsPerMinute: number;
  scalingRule: {
    minPhotos: number;
    maxPhotos: number;
    minChars: number;
    maxChars: number;
  };
}

export interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  language: string;
  photoText: LLMPhotoTextConfig;
  summary: LLMSummaryConfig;
}

export interface TTSConfig {
  provider: string;
  model: string;
  voiceName: string;
  speakingStyle: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface RecordingConfig {
  format: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface OutputConfig {
  dir: string;
  saveIntermediateResults: boolean;
  generateReport: boolean;
}

export interface PipelineConfig {
  stt: STTConfig;
  llm: LLMConfig;
  tts: TTSConfig;
  recording: RecordingConfig;
  output: OutputConfig;
}

export interface AppConfig {
  deepgramApiKey: string;
  geminiApiKey: string;
  pipeline: PipelineConfig;
}

// ── 加载配置 ────────────────────────────────────────────────

function loadPipelineConfig(): PipelineConfig {
  const configPath = resolve(PROJECT_ROOT, 'pipeline.config.json');
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);

    // 移除 _comment 字段（仅用于文件可读性）
    const clean = JSON.parse(
      JSON.stringify(parsed, (key, value) =>
        key === '_comment' || key.startsWith('alternative') ? undefined : value
      )
    );

    return clean as PipelineConfig;
  } catch (error) {
    throw new Error(
      `无法加载配置文件 ${configPath}:\n${error instanceof Error ? error.message : error}`
    );
  }
}

function validateApiKeys(): { deepgramApiKey: string; geminiApiKey: string } {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const missing: string[] = [];
  if (!deepgramApiKey || deepgramApiKey === 'your_deepgram_api_key_here') {
    missing.push('DEEPGRAM_API_KEY');
  }
  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    missing.push('GEMINI_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `缺少以下 API 密钥: ${missing.join(', ')}\n` +
      `请在 .env 文件中配置（参考 .env.example）`
    );
  }

  return { deepgramApiKey: deepgramApiKey!, geminiApiKey: geminiApiKey! };
}

// ── 导出 ────────────────────────────────────────────────────

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    const keys = validateApiKeys();
    const pipeline = loadPipelineConfig();

    // 将相对路径解析为绝对路径
    pipeline.output.dir = resolve(PROJECT_ROOT, pipeline.output.dir);

    _config = {
      ...keys,
      pipeline,
    };
  }
  return _config;
}

/**
 * 仅加载管道配置（不验证 API 密钥）
 * 用于查看配置或不需要 API 调用的场景
 */
export function getPipelineConfigOnly(): PipelineConfig {
  return loadPipelineConfig();
}

/**
 * 根据照片数量动态计算目标总结字数
 */
export function calculateTargetSummaryLength(photoCount: number): number {
  const { scalingRule, charsPerMinute, targetReadingMinutes } = getConfig().pipeline.llm.summary;

  // 根据照片数量线性插值
  const ratio = Math.min(
    1,
    Math.max(0, (photoCount - scalingRule.minPhotos) / (scalingRule.maxPhotos - scalingRule.minPhotos))
  );
  const targetChars = Math.round(
    scalingRule.minChars + ratio * (scalingRule.maxChars - scalingRule.minChars)
  );

  // 确保在目标阅读时间范围内
  const minChars = targetReadingMinutes.min * charsPerMinute;
  const maxChars = targetReadingMinutes.max * charsPerMinute;

  return Math.min(maxChars, Math.max(minChars, targetChars));
}
