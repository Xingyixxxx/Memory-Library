/**
 * 麦克风录音 CLI 工具
 * 运行: npm run record
 *
 * 录制一段语音并保存到 samples/ 目录
 * 需要 sox 工具: brew install sox
 */

import { recordFromMicrophone, checkSoxInstalled } from './audio.js';
import { createLogger } from './logger.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

const log = createLogger('Record');

async function main() {
  log.divider('🎙️ 麦克风录音工具');

  // 检查 sox 是否安装
  const hasSox = await checkSoxInstalled();
  if (!hasSox) {
    log.error('未检测到 sox 工具');
    log.info('请先安装: brew install sox');
    process.exit(1);
  }

  log.success('sox 已安装');

  // 询问文件名
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const filename = await new Promise<string>((resolve) => {
    rl.question('请输入录音文件名 (默认: recording): ', (answer) => {
      resolve(answer.trim() || 'recording');
    });
  });

  rl.close();

  const outputPath = resolve(PROJECT_ROOT, 'samples', `${filename}.wav`);

  try {
    const savedPath = await recordFromMicrophone(outputPath, 16000, 1, 16);
    log.divider('录音完成');
    log.success(`文件已保存: ${savedPath}`);
    log.info('你可以在 test-stt.ts 中使用此文件进行转写测试');
  } catch (error) {
    log.error('录音失败', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
