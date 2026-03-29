/**
 * 端到端管道测试脚本
 * 运行: npm run test:pipeline
 *
 * 测试完整的 STT → LLM → TTS 管道
 * 使用 samples/ 目录下的音频文件
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { runMemoryPipeline, type PipelineInput } from '../src/pipeline/memory-pipeline.js';
import { createLogger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const log = createLogger('Pipeline');

async function main() {
  log.divider('🚀 端到端管道测试');

  // 查找 samples 目录中的音频文件
  const samplesDir = resolve(PROJECT_ROOT, 'samples');

  if (!existsSync(samplesDir)) {
    log.error(`samples 目录不存在: ${samplesDir}`);
    log.info('请创建 samples/ 目录并放入测试音频文件');
    log.info('或者运行 npm run record 来录制测试音频');
    process.exit(1);
  }

  const audioExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.webm', '.flac'];
  const audioFiles = readdirSync(samplesDir)
    .filter(f => audioExtensions.includes(extname(f).toLowerCase()))
    .sort()
    .map(f => resolve(samplesDir, f));

  if (audioFiles.length === 0) {
    log.error('samples/ 目录下没有找到音频文件');
    log.info('请添加测试音频文件或运行 npm run record');
    process.exit(1);
  }

  log.info(`找到 ${audioFiles.length} 个音频文件`);
  audioFiles.forEach((f, i) => log.metric(`文件 ${i + 1}`, f));

  // 构建管道输入
  const input: PipelineInput = {
    audioFiles,

    // 事件元数据（你可以根据实际测试修改这些值）
    eventMeta: {
      title: '测试事件',
      date: new Date().toLocaleDateString('zh-CN'),
      location: '测试地点',
    },

    // 用户感悟（可选，留空则不提供给 LLM）
    // 取消下面的注释并填入你的感悟来测试效果
    // userThoughts: '我想表达的是...',

    // 是否生成总结散文（设为 false 可跳过总结步骤）
    enableSummary: true,

    // 是否生成 TTS 朗读音频（设为 false 可跳过 TTS 步骤）
    enableTTS: true,
  };

  // 执行管道
  const output = await runMemoryPipeline(input);

  // 打印最终结果
  log.divider('📋 最终结果概览');

  console.log('\n📝 各照片文案:');
  for (const pt of output.photoTextResults) {
    console.log(`  #${pt.photoIndex + 1}: ${pt.polishedText}`);
  }

  if (output.summaryResult?.summaryText) {
    console.log('\n📖 事件总结:');
    console.log('─'.repeat(50));
    console.log(output.summaryResult.summaryText);
    console.log('─'.repeat(50));
  }

  if (output.ttsResult) {
    console.log(`\n🔊 朗读音频: ${output.ttsResult.audioPath}`);
  }

  if (output.reportPath) {
    console.log(`\n📊 完整报告: ${output.reportPath}`);
  }

  console.log(`\n⏱️  总耗时: ${(output.totalElapsedMs / 1000).toFixed(1)}s`);

  log.divider('测试结束');
}

main().catch(console.error);
