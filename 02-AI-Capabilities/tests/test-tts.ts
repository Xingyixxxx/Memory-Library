/**
 * TTS 独立测试脚本
 * 运行: npm run test:tts
 *
 * 测试 Gemini 文字转语音功能
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { textToSpeech, textToSpeechLong } from '../src/tts/gemini-tts.js';
import { createLogger } from '../src/utils/logger.js';
import { ensureOutputDir } from '../src/utils/audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const log = createLogger('TTS');

// ── 测试文本 ────────────────────────────────────────────────

const SHORT_TEXT = '那天的南京路，灯火温柔地铺满了每一块砖石。人潮从身边流过，却并不觉得喧嚣。也许是因为身边有你。';

const LONG_TEXT = `三月的上海，空气里已经有了春天的味道。

我们从地铁口出来的时候，南京路上的霓虹刚刚亮起。那些光落在路面上，像是谁不小心打翻了一盒水彩。

你说想吃小笼包，于是我们钻进了弄堂深处那家排着长队的老字号。等待的半个小时里，你靠在墙上给我讲你小时候在这附近住过的故事。灯光打在你的侧脸上，我突然觉得时间过得很慢，慢到可以看清每一个细节。

小笼包端上来的时候，热气在灯下慢慢散开。你小心翼翼地咬了一口，被汤汁烫到，然后笑了起来。那个画面，我想我会记很久。

后来我们走到外滩，风有一点凉，对面的陆家嘴在夜色里安静地闪烁着。你把手缩进袖子里，说这大概是你见过最好看的夜景。

我没有说话，只是看着你看夜景的样子，想着这个城市再大、再热闹，有些瞬间只属于两个人。`;

// ── 测试执行 ────────────────────────────────────────────────

async function testShortTTS() {
  log.divider('测试 1: 短文本 TTS');
  log.info('文本', SHORT_TEXT);

  const outputPath = resolve(PROJECT_ROOT, 'output', 'test-tts-short.wav');
  const result = await textToSpeech(SHORT_TEXT, outputPath);

  log.success('短文本 TTS 完成');
  log.metric('输出文件', result.audioPath);
  log.metric('耗时', result.elapsedMs, 'ms');
}

async function testLongTTS() {
  log.divider('测试 2: 长文本 TTS（分段处理）');
  log.metric('文本字数', LONG_TEXT.length, '字');

  const outputPath = resolve(PROJECT_ROOT, 'output', 'test-tts-long.wav');
  const result = await textToSpeechLong(LONG_TEXT, outputPath);

  log.success('长文本 TTS 完成');
  log.metric('输出文件', result.audioPath);
  log.metric('耗时', result.elapsedMs, 'ms');
}

// ── 执行 ────────────────────────────────────────────────────

async function main() {
  log.divider('🔊 Gemini TTS 测试');

  // 确保输出目录存在
  ensureOutputDir(resolve(PROJECT_ROOT, 'output'));

  await testShortTTS();
  await testLongTTS();

  log.divider('测试结束');
  log.info('请播放 output/ 目录下的 WAV 文件检查朗读效果');
}

main().catch(console.error);
