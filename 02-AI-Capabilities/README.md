# 模块二：AI 能力测试 (STT / LLM / TTS)

## 📌 模块定位

本文件夹（`02-AI-Capabilities`）专门用于测试和微调"记忆博物馆"的大脑：语音转文字（STT）、内容情感化重塑（LLM）、以及文字转语音朗读（TTS）。
在此阶段，**不关心网页长什么样**，只专注于在纯 TypeScript/Node.js 脚本环境中跑通 API 并调优效果。

## 🎯 最终交付物

一整套完善的测试数据流（API 服务封装）：传入一组照片描述语音 → 稳定输出高情感浓度、段落清洗完毕的文案 + 可直接播放的 TTS 朗读音频。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：

```env
DEEPGRAM_API_KEY=你的 Deepgram API Key
GEMINI_API_KEY=你的 Gemini API Key
```

> API Key 获取地址：
> - Deepgram: https://console.deepgram.com
> - Gemini: https://aistudio.google.com/apikey

### 3. 放入测试音频

将你的语音录音文件（WAV / MP3 / M4A 等格式）放入 `samples/` 目录。

### 4. 运行测试

```bash
# ── 分步测试（推荐先逐个跑通） ──────────────────

npm run test:stt        # 仅测试 Deepgram 语音转文字
npm run test:llm        # 仅测试 Gemini 文案润色（使用模拟数据，不需要音频）
npm run test:tts        # 仅测试 Gemini TTS 语音合成

# ── 完整管道测试 ────────────────────────────────

npm run test:pipeline   # 🔥 一键跑通 STT → LLM 润色 → LLM 总结 → TTS 全流程
```

### 5. 查看结果

所有生成的文件都会保存在 `output/` 目录下：

```
output/
├── stt-results_2026-03-29T14-30-00.json    # STT 转写结果（含时间戳、置信度）
├── photo-texts_2026-03-29T14-30-00.json    # 润色后的照片文案
├── summary_2026-03-29T14-30-00.txt         # 事件总结散文（纯文本）
├── narration_2026-03-29T14-30-00.wav       # TTS 朗读音频
└── report_2026-03-29T14-30-00.md           # 📊 完整处理报告
```

---

## 🎙️ 麦克风录音

如果你想直接用麦克风录音而不是手动放入音频文件：

```bash
# 安装录音工具（仅首次需要）
brew install sox

# 开始录音（按 Enter 停止）
npm run record
```

录音文件会自动保存到 `samples/` 目录下。

---

## ⚙️ 配置说明

所有参数都可以通过编辑 `pipeline.config.json` 直接修改，无需改动代码。

### STT 配置

| 配置项 | 说明 | 默认值 | 可选值 |
|--------|------|--------|--------|
| `stt.model` | 语音识别模型 | `nova-2` | `nova-2`, `nova-3` |
| `stt.language` | 识别语言 | `zh-CN` | `zh-CN`, `en`, `multi` |

### LLM 配置

| 配置项 | 说明 | 默认值 | 可选值 |
|--------|------|--------|--------|
| `llm.model` | 润色大模型 | `gemini-2.5-pro` | `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-3.1-flash-lite-preview` |
| `llm.language` | Prompt 语言 | `zh-CN` | `zh-CN`, `en` |
| `llm.photoText.maxLength` | 单照片文案上限 | `500` 字 | 任意正整数 |
| `llm.summary.enabled` | 是否生成总结 | `true` | `true` / `false` |
| `llm.temperature` | 创造性控制 | `0.75` | `0.0` - `1.0` |

### TTS 配置

| 配置项 | 说明 | 默认值 | 可选值 |
|--------|------|--------|--------|
| `tts.model` | TTS 模型 | `gemini-2.5-flash-preview-tts` | - |
| `tts.voiceName` | 声音选择 | `Kore` | 见下表 |
| `tts.speakingStyle` | 朗读风格指令 | 温柔沉静 | 任意自然语言描述 |

**可用声音列表**：

| 声音名称 | 风格 |
|----------|------|
| `Kore` | 女·温柔 |
| `Aoede` | 女·明亮 |
| `Leda` | 女·沉稳 |
| `Puck` | 男·温暖 |
| `Charon` | 男·深沉 |
| `Orus` | 男·中性 |
| `Fenrir` | 男·低沉 |
| `Zephyr` | 中性·空灵 |

---

## 📁 项目结构

```
02-AI-Capabilities/
├── pipeline.config.json          # ⭐ 可编辑的配置文件（模型/语言/声音）
├── .env                          # API 密钥（不提交到 Git）
│
├── src/
│   ├── config.ts                 # 配置加载与验证
│   ├── stt/deepgram.ts           # Deepgram STT 服务
│   ├── llm/
│   │   ├── gemini.ts             # Gemini LLM 润色服务
│   │   └── prompts.ts            # Prompt 模板（中英文）
│   ├── tts/gemini-tts.ts         # Gemini TTS 服务
│   ├── pipeline/memory-pipeline.ts  # 完整管道编排
│   └── utils/
│       ├── logger.ts             # 彩色日志
│       ├── audio.ts              # 音频工具
│       └── record-cli.ts         # 录音 CLI
│
├── tests/
│   ├── test-stt.ts               # STT 独立测试
│   ├── test-llm.ts               # LLM 独立测试（模拟数据）
│   ├── test-tts.ts               # TTS 独立测试
│   └── test-pipeline.ts          # 端到端管道测试
│
├── prompts/prompt-log.md         # Prompt 版本调试记录
├── samples/                      # 放入测试音频文件
└── output/                       # 自动生成的结果文件
```

---

## 🔄 完整数据流

```
🎙️ 语音录音 (每张照片一段描述)
     │
     ▼
[Deepgram STT] ──→ 📝 原始转写文本（保留口语原貌）
     │
     ▼
[Gemini LLM 单条润色] ──→ ✨ 照片文案（≤500字，有画面感）
     │
     ▼  (可选：用户可选择是否生成总结，并添加自己的感悟)
[Gemini LLM 事件总结] ──→ 📖 散文旁白（1-2分钟朗读量）
     │
     ▼  (可选)
[Gemini TTS] ──→ 🔊 WAV 朗读音频
```

---

## 📋 模块任务拆解

1. **基础设置** ✅ — 环境配置、API 密钥、TypeScript 脚本
2. **Deepgram STT 联调** ✅ — nova-2 中文转写，支持段落/语义分段
3. **Gemini LLM 润色联调** ✅ — 单条照片润色 + 多条融合总结散文
4. **Gemini TTS 联调** ✅ — 温柔女声朗读，支持长文本分段
5. **异常情况联调** ✅ — 多段不连贯录音融合为一篇文章
6. **Prompt 调优** 🔄 — 在 `prompts/prompt-log.md` 中持续迭代

## ⚠️ 模块开发规则

- **环境隔离**：纯 TypeScript/Node.js，不带任何前端库
- **重在 Prompt 调优**：核心是让 AI 生成的文本不仅要"对"，还要"美"

## 可用服务

### 1. Deepgram
- Playground: https://playground.deepgram.com/?endpoint=listen-streaming&endpointing=false&language=zh&model=nova-2
- 模型: `nova-2`

### 2. Gemini
- 大语言模型: `gemini-2.5-pro` / `gemini-3.1-flash-lite-preview`
- TTS 模型: `gemini-2.5-flash-preview-tts`
