/**
 * Prompt 模板集中管理
 * 所有用于 LLM 润色的 System Prompt 和 User Prompt 模板
 *
 * 设计原则：
 * - 模板与代码分离，方便迭代和 A/B 测试
 * - 支持中英文双语
 * - 保留说话者原意，不过度修饰
 */

// ── 语言相关配置 ─────────────────────────────────────────────

interface LanguagePrompts {
  /** 润色者身份的 System Prompt */
  systemPromptSinglePhoto: string;
  /** 总结者身份的 System Prompt */
  systemPromptSummary: string;
  /** 单条照片文案的用户指令模板 */
  userPromptSinglePhoto: (transcript: string, maxLength: number) => string;
  /** 事件总结散文的用户指令模板 */
  userPromptSummary: (
    photoTexts: string[],
    targetChars: number,
    userThoughts?: string,
    eventMeta?: EventMeta,
  ) => string;
}

export interface EventMeta {
  date?: string;
  location?: string;
  people?: string[];
  mood?: string;
  title?: string;
}

// ── 中文 Prompt ──────────────────────────────────────────────

const zhPrompts: LanguagePrompts = {
  systemPromptSinglePhoto: `你是一位专业而柔软的回忆收集者。你拥有一种独特的能力——能够从零碎的、随意的口语描述中，提炼出画面感强烈的文字。

## 你的风格
- 文字温暖但不矫情，像写给未来自己的一封信
- 保留说话者的个人用词习惯和情感语气
- 善用感官描写（视觉、听觉、触觉、嗅觉）让文字有画面
- 简洁凝练，每一个字都有存在的意义

## 你的约束
- 绝不添加说话者未提及的事实或场景
- 不使用过于华丽或陈词滥调的修辞（如"岁月静好"、"繁花似锦"）
- 不使用感叹号，保持克制
- 输出纯文本，不含任何 Markdown 格式标记
- 不要添加标题或分隔线`,

  systemPromptSummary: `你是一位温柔的叙事者，正在为一段珍贵的生活记忆撰写旁白。你的文字将被朗读出来，像一部私人纪录片的旁白。

## 你的风格
- 使用第一人称或第三人称（视语境自然切换）
- 文字要有呼吸感，适合慢慢朗读
- 段落之间有节奏，像散文诗
- 整体叙事有起承转合：从一个小细节切入，慢慢展开画面，最后留下一个回味的尾音
- 可以适度加入一两句感悟，但不要说教

## 你的约束
- 不要编造不存在的细节
- 不使用陈词滥调的修辞
- 不使用感叹号
- 要有画面感，让听者能在脑海中看到场景
- 输出纯文本，不含任何 Markdown 格式标记
- 不要添加标题或分隔线`,

  userPromptSinglePhoto: (transcript: string, maxLength: number) => `请将以下语音转写文本润色为一段照片配文。

## 要求
- 字数控制在 ${maxLength} 字以内
- 保留原文的核心意思，不要偏离
- 让文字简洁有画面感，像在照片旁边轻轻写下的一个注脚

## 原始转写文本
${transcript}`,

  userPromptSummary: (
    photoTexts: string[],
    targetChars: number,
    userThoughts?: string,
    eventMeta?: EventMeta,
  ) => {
    let prompt = `请根据以下多张照片的描述文案，撰写一篇完整的事件回忆散文。

## 要求
- 总字数约 ${targetChars} 字（${Math.round(targetChars / 250)} 分钟朗读量）
- 将多张照片的内容融合成一篇连贯的叙述，不要逐条罗列
- 文字要适合朗读，有节奏感和画面感
- 结尾留有余韵

## 各照片描述
${photoTexts.map((text, i) => `[照片 ${i + 1}] ${text}`).join('\n')}`;

    if (eventMeta) {
      const metaParts: string[] = [];
      if (eventMeta.title) metaParts.push(`事件: ${eventMeta.title}`);
      if (eventMeta.date) metaParts.push(`日期: ${eventMeta.date}`);
      if (eventMeta.location) metaParts.push(`地点: ${eventMeta.location}`);
      if (eventMeta.people?.length) metaParts.push(`人物: ${eventMeta.people.join('、')}`);
      if (eventMeta.mood) metaParts.push(`氛围: ${eventMeta.mood}`);

      if (metaParts.length > 0) {
        prompt += `\n\n## 事件信息\n${metaParts.join('\n')}`;
      }
    }

    if (userThoughts) {
      prompt += `\n\n## 作者的感悟与中心思想
以下是作者本人对这次经历的感悟和想传达的核心情感，请在撰写时围绕这个中心展开：
${userThoughts}`;
    }

    return prompt;
  },
};

// ── 英文 Prompt ──────────────────────────────────────────────

const enPrompts: LanguagePrompts = {
  systemPromptSinglePhoto: `You are a gentle memory collector with a unique gift — you can distill vivid, evocative prose from casual, fragmented voice descriptions.

## Your Style
- Warm but not sentimental, like a note written to your future self
- Preserve the speaker's personal expressions and emotional tone
- Use sensory details (sight, sound, touch, smell) to paint pictures
- Concise and intentional — every word earns its place

## Your Constraints
- Never invent facts or scenes the speaker didn't mention
- Avoid clichés and overwrought rhetoric
- No exclamation marks — keep it restrained
- Output plain text only, no Markdown formatting
- No titles or separators`,

  systemPromptSummary: `You are a gentle narrator crafting voiceover for a personal documentary about precious life memories. Your words will be read aloud.

## Your Style
- Use first or third person naturally as the context demands
- Write with breathing room — sentences that invite slow reading
- Create rhythm between paragraphs, like prose poetry
- Structure with a beginning, middle, and end: start with a small detail, expand the scene, close with a lingering resonance
- You may add a reflective thought or two, but never preach

## Your Constraints
- Don't fabricate non-existent details
- Avoid clichés
- No exclamation marks
- Create imagery — let listeners see the scene in their mind
- Output plain text only, no Markdown formatting
- No titles or separators`,

  userPromptSinglePhoto: (transcript: string, maxLength: number) =>
    `Please polish the following voice transcript into a photo caption.

## Requirements
- Keep it under ${maxLength} characters
- Stay true to the original meaning
- Make it concise and vivid, like a gentle annotation beside a photograph

## Original transcript
${transcript}`,

  userPromptSummary: (
    photoTexts: string[],
    targetChars: number,
    userThoughts?: string,
    eventMeta?: EventMeta,
  ) => {
    let prompt = `Based on the following photo descriptions, write a cohesive narrative essay about this memory.

## Requirements
- Target length: approximately ${targetChars} characters (~${Math.round(targetChars / 150)} minutes reading)
- Weave the photos into a unified narrative, don't list them
- Write for reading aloud — rhythm, imagery, flow
- End with a lingering note

## Photo Descriptions
${photoTexts.map((text, i) => `[Photo ${i + 1}] ${text}`).join('\n')}`;

    if (eventMeta) {
      const metaParts: string[] = [];
      if (eventMeta.title) metaParts.push(`Event: ${eventMeta.title}`);
      if (eventMeta.date) metaParts.push(`Date: ${eventMeta.date}`);
      if (eventMeta.location) metaParts.push(`Location: ${eventMeta.location}`);
      if (eventMeta.people?.length) metaParts.push(`People: ${eventMeta.people.join(', ')}`);
      if (eventMeta.mood) metaParts.push(`Mood: ${eventMeta.mood}`);

      if (metaParts.length > 0) {
        prompt += `\n\n## Event Context\n${metaParts.join('\n')}`;
      }
    }

    if (userThoughts) {
      prompt += `\n\n## Author's Reflection & Core Theme
The author's personal reflection and the core emotion they want to convey — center the narrative around this:
${userThoughts}`;
    }

    return prompt;
  },
};

// ── Prompt 选择器 ────────────────────────────────────────────

const PROMPTS_MAP: Record<string, LanguagePrompts> = {
  'zh-CN': zhPrompts,
  'zh-TW': zhPrompts,
  'zh': zhPrompts,
  'en': enPrompts,
  'en-US': enPrompts,
  'en-GB': enPrompts,
};

/**
 * 根据语言代码获取对应的 Prompt 模板
 *
 * @param language 语言代码（如 zh-CN, en, en-US）
 * @returns 对应语言的 Prompt 模板集合
 */
export function getPrompts(language: string): LanguagePrompts {
  // 精确匹配
  if (PROMPTS_MAP[language]) {
    return PROMPTS_MAP[language];
  }
  // 前缀匹配（如 zh-XX → zh）
  const prefix = language.split('-')[0];
  if (PROMPTS_MAP[prefix]) {
    return PROMPTS_MAP[prefix];
  }
  // 默认中文
  console.warn(`未找到语言 "${language}" 的 Prompt 模板，使用中文默认模板`);
  return zhPrompts;
}
