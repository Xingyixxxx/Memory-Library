/**
 * 音频文件工具
 * - 读取本地音频文件
 * - 保存 WAV 文件（用于 TTS 输出）
 * - 麦克风录音（通过 sox 命令）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { createLogger } from './logger.js';

const log = createLogger('Audio');

// ── 音频文件读取 ─────────────────────────────────────────────

/**
 * 读取本地音频文件为 Buffer
 */
export function readAudioFile(filePath: string): Buffer {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new Error(`音频文件不存在: ${absPath}`);
  }

  const ext = extname(absPath).toLowerCase();
  const supportedFormats = ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac', '.aac'];
  if (!supportedFormats.includes(ext)) {
    log.warn(`不常见的音频格式: ${ext}，Deepgram 可能不支持`);
  }

  const buffer = readFileSync(absPath);
  log.info(`已读取音频文件: ${basename(absPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer;
}

/**
 * 获取音频文件的 MIME 类型
 */
export function getAudioMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.wav':  'audio/wav',
    '.mp3':  'audio/mpeg',
    '.m4a':  'audio/mp4',
    '.ogg':  'audio/ogg',
    '.webm': 'audio/webm',
    '.flac': 'audio/flac',
    '.aac':  'audio/aac',
  };
  return mimeMap[ext] || 'audio/wav';
}

// ── WAV 文件写入 ─────────────────────────────────────────────

/**
 * 将 PCM 原始数据保存为 WAV 文件
 * Gemini TTS 返回的是 raw PCM，需要添加 WAV 头
 *
 * @param outputPath  输出文件路径
 * @param pcmData     PCM 原始音频数据（Base64 字符串或 Buffer）
 * @param sampleRate  采样率（默认 24000）
 * @param channels    声道数（默认 1）
 * @param bitDepth    位深度（默认 16）
 */
export function savePcmAsWav(
  outputPath: string,
  pcmData: string | Buffer,
  sampleRate: number = 24000,
  channels: number = 1,
  bitDepth: number = 16,
): void {
  // 确保输出目录存在
  const dir = resolve(outputPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 解码 Base64 为 Buffer（如果是字符串）
  const audioBuffer = typeof pcmData === 'string'
    ? Buffer.from(pcmData, 'base64')
    : pcmData;

  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const dataSize = audioBuffer.length;
  const headerSize = 44;

  // 构建 WAV 文件头
  const header = Buffer.alloc(headerSize);
  header.write('RIFF', 0);                          // RIFF 标记
  header.writeUInt32LE(dataSize + headerSize - 8, 4); // 文件大小
  header.write('WAVE', 8);                          // WAVE 标记
  header.write('fmt ', 12);                         // fmt chunk
  header.writeUInt32LE(16, 16);                     // fmt chunk 大小
  header.writeUInt16LE(1, 20);                      // PCM 格式
  header.writeUInt16LE(channels, 22);               // 声道数
  header.writeUInt32LE(sampleRate, 24);             // 采样率
  header.writeUInt32LE(byteRate, 28);               // 字节率
  header.writeUInt16LE(blockAlign, 32);             // 块对齐
  header.writeUInt16LE(bitDepth, 34);               // 位深度
  header.write('data', 36);                         // data chunk
  header.writeUInt32LE(dataSize, 40);               // 数据大小

  // 合并并写入文件
  const wavBuffer = Buffer.concat([header, audioBuffer]);
  writeFileSync(outputPath, wavBuffer);

  const durationSec = dataSize / byteRate;
  log.success(`WAV 文件已保存: ${basename(outputPath)} (${durationSec.toFixed(1)}s)`);
}

// ── 麦克风录音 ───────────────────────────────────────────────

/**
 * 检查系统是否安装了 sox
 */
export async function checkSoxInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', ['sox']);
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * 通过麦克风录音（使用 sox/rec 命令）
 * 用户按 Enter 停止录音
 *
 * @param outputPath  输出文件路径 (.wav)
 * @param sampleRate  采样率（默认 16000，适合 STT）
 * @param channels    声道数
 * @param bitDepth    位深度
 * @returns Promise<string> 录音文件路径
 */
export async function recordFromMicrophone(
  outputPath: string,
  sampleRate: number = 16000,
  channels: number = 1,
  bitDepth: number = 16,
): Promise<string> {
  // 检查 sox 是否安装
  const hasSox = await checkSoxInstalled();
  if (!hasSox) {
    throw new Error(
      '未检测到 sox 工具。请先安装:\n' +
      '  macOS: brew install sox\n' +
      '  Ubuntu: sudo apt install sox libsox-fmt-all'
    );
  }

  // 确保输出目录存在
  const dir = resolve(outputPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const absPath = resolve(outputPath);

  log.divider('🎙️ 麦克风录音');
  log.info('开始录音... 按 Enter 停止');
  console.log();

  return new Promise((resolve, reject) => {
    // 使用 rec 命令（sox 的录音前端）
    const rec = spawn('rec', [
      '-r', String(sampleRate),
      '-c', String(channels),
      '-b', String(bitDepth),
      '-e', 'signed-integer',
      absPath,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    rec.on('error', (err) => {
      reject(new Error(`录音启动失败: ${err.message}`));
    });

    // 监听用户按 Enter 停止
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('line', () => {
      log.info('正在停止录音...');
      rec.kill('SIGINT');
      rl.close();
    });

    rec.on('close', (code) => {
      if (existsSync(absPath)) {
        log.success(`录音已保存: ${basename(absPath)}`);
        resolve(absPath);
      } else if (code !== 0 && code !== null) {
        reject(new Error(`录音失败 (退出码: ${code})`));
      } else {
        resolve(absPath);
      }
    });
  });
}

// ── 输出目录管理 ─────────────────────────────────────────────

/**
 * 确保输出目录存在
 */
export function ensureOutputDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    log.info(`已创建输出目录: ${dirPath}`);
  }
}

/**
 * 生成带时间戳的输出文件名
 */
export function generateOutputFilename(prefix: string, ext: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}${ext}`;
}
