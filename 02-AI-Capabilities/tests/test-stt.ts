/**
 * STT 独立测试脚本
 * 运行: npm run test:stt
 *
 * 测试 Deepgram 语音转文字功能
 * 使用 samples/ 目录下的音频文件
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { transcribeFile } from '../src/stt/deepgram.js';
import { createLogger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const log = createLogger('STT');

async function main() {
  log.divider('🎙️ Deepgram STT 测试');

  // 查找 samples 目录中的音频文件
  const samplesDir = resolve(PROJECT_ROOT, 'samples');

  if (!existsSync(samplesDir)) {
    log.error(`samples 目录不存在: ${samplesDir}`);
    log.info('请创建 samples/ 目录并放入测试音频文件');
    log.info('你也可以运行 npm run record 来录制一段测试音频');
    process.exit(1);
  }

  const audioExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac'];
  const audioFiles = readdirSync(samplesDir)
    .filter(f => audioExtensions.includes(extname(f).toLowerCase()))
    .map(f => resolve(samplesDir, f));

  if (audioFiles.length === 0) {
    log.error('samples/ 目录下没有找到音频文件');
    log.info('支持的格式: ' + audioExtensions.join(', '));
    log.info('你可以运行 npm run record 来录制测试音频');
    process.exit(1);
  }

  log.info(`找到 ${audioFiles.length} 个音频文件`);

  // 逐个转写
  for (const file of audioFiles) {
    try {
      const result = await transcribeFile(file);

      log.divider('转写完成');
      log.metric('文件', file);
      log.metric('时长', result.duration.toFixed(1), 's');
      log.metric('置信度', `${(result.confidence * 100).toFixed(1)}%`);
      log.metric('段落数', result.paragraphs.length);

      console.log('\n📝 完整转写文本:');
      console.log('─'.repeat(40));
      console.log(result.rawTranscript);
      console.log('─'.repeat(40));

      if (result.paragraphs.length > 1) {
        console.log('\n📑 段落拆分:');
        result.paragraphs.forEach((p, i) => {
          console.log(`  [段落 ${i + 1}] ${p}`);
        });
      }

      if (result.utterances.length > 0) {
        console.log('\n🗣️ 语义分段:');
        result.utterances.forEach((u, i) => {
          console.log(`  [${u.start.toFixed(1)}s - ${u.end.toFixed(1)}s] ${u.transcript}`);
        });
      }
    } catch (error) {
      log.error(`转写失败: ${file}`, error);
    }
  }

  log.divider('测试结束');
}

main().catch(console.error);
