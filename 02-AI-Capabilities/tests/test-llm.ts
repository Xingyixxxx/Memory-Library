/**
 * LLM 独立测试脚本
 * 运行: npm run test:llm
 *
 * 测试 Gemini 文案润色与事件总结功能
 * 使用模拟的 STT 转写文本
 */

import { polishPhotoText, generateSummary } from '../src/llm/gemini.js';
import { createLogger } from '../src/utils/logger.js';

const log = createLogger('LLM');

// ── 模拟数据 ────────────────────────────────────────────────

/** 模拟的最小化 STT 转写文本（口语化的照片描述） */
const MOCK_TRANSCRIPTS = [
  '嗯就是今天去了那个南京路步行街，然后那个灯光特别特别漂亮，就是那种老上海的感觉，人虽然很多但是很有氛围',
  '这张是在外滩拍的，呃就是对面那个陆家嘴的夜景，真的很震撼，风吹过来有点冷但是心情特别好',
  '最后我们去吃了一家老字号的小笼包，就在那个弄堂里面，店面很小但是味道太好了，排了半小时队',
];

const MOCK_EVENT_META = {
  title: '上海夜行记',
  date: '2026年3月15日',
  location: '上海',
  people: ['我', '小王'],
  mood: '愉悦、怀旧',
};

// ── 测试执行 ────────────────────────────────────────────────

async function testSinglePhotoPolish() {
  log.divider('测试 1: 单条照片文案润色');

  for (let i = 0; i < MOCK_TRANSCRIPTS.length; i++) {
    log.step(`处理照片 #${i + 1}...`);
    const result = await polishPhotoText(MOCK_TRANSCRIPTS[i], i);

    console.log(`\n  原文 (${MOCK_TRANSCRIPTS[i].length}字): ${MOCK_TRANSCRIPTS[i]}`);
    console.log(`  润色 (${result.polishedText.length}字): ${result.polishedText}`);
    console.log(`  耗时: ${result.elapsedMs}ms\n`);
  }
}

async function testSummaryGeneration() {
  log.divider('测试 2: 事件总结散文（无用户感悟）');

  // 先润色所有文案
  const polishedTexts: string[] = [];
  for (let i = 0; i < MOCK_TRANSCRIPTS.length; i++) {
    const result = await polishPhotoText(MOCK_TRANSCRIPTS[i], i);
    polishedTexts.push(result.polishedText);
  }

  // 生成总结（不带用户感悟）
  const summaryResult = await generateSummary(polishedTexts, {
    eventMeta: MOCK_EVENT_META,
  });

  console.log('\n📖 总结散文:');
  console.log('─'.repeat(50));
  console.log(summaryResult.summaryText);
  console.log('─'.repeat(50));
  console.log(`字数: ${summaryResult.actualChars} / 目标: ${summaryResult.targetChars}`);
  console.log(`预估朗读: ${(summaryResult.estimatedReadingSeconds / 60).toFixed(1)} 分钟`);
}

async function testSummaryWithUserThoughts() {
  log.divider('测试 3: 事件总结散文（带用户感悟）');

  // 使用之前的模拟文案
  const mockPolishedTexts = [
    '霓虹铺满南京路的砖石，人潮恰好衬出灯火的温柔',
    '外滩的风带着凉意，对岸的陆家嘴在夜色中安静地闪烁',
    '弄堂深处那家老字号，小笼包的热气在灯下慢慢散开',
  ];

  const userThoughts = '我想表达的是那种在繁华城市中找到的安静角落的感觉，虽然人很多很嘈杂，但和好朋友在一起就觉得哪里都可以变得很温暖很美好。';

  const summaryResult = await generateSummary(mockPolishedTexts, {
    eventMeta: MOCK_EVENT_META,
    userThoughts,
  });

  console.log('\n📖 总结散文（含用户感悟）:');
  console.log('─'.repeat(50));
  console.log(summaryResult.summaryText);
  console.log('─'.repeat(50));
  console.log(`字数: ${summaryResult.actualChars} / 目标: ${summaryResult.targetChars}`);
  console.log(`预估朗读: ${(summaryResult.estimatedReadingSeconds / 60).toFixed(1)} 分钟`);
}

// ── 执行 ────────────────────────────────────────────────────

async function main() {
  log.divider('🧠 Gemini LLM 测试');

  await testSinglePhotoPolish();
  await testSummaryGeneration();
  await testSummaryWithUserThoughts();

  log.divider('测试结束');
}

main().catch(console.error);
