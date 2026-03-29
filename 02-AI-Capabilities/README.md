# 模块二：AI 能力测试 (STT 与内容生成)

## 📌 模块定位

本文件夹（`02-AI-Capabilities`）专门用于测试和微调“记忆博物馆”的大脑：语音转文字（STT）与内容情感化重塑（LLM）。
在此阶段，我们**不关心网页长什么样**，只专注于在 Node.js 或轻量级脚本环境中跑通 API。

## 🎯 最终交付物

一整套完善的测试数据流（API 服务封装），只要将某组音频的 buffer 或 URL 传给该模块脚本，它就能稳定输出高情感浓度、段落清洗完毕的文案。

主要目的是，在使用过程中，我需要对每一张照片进行描述，可以使用语音，然后根据语音转换成为没有太多改动意思相近，但是又是简单修改的文案，这里先STT再LLM润色。

在整理每一张照片对应的文案后，根据所有的每张照片的文案和在一起进行总结，得到最后稳定输出高情感浓度、段落清洗完毕的一个事件很多照片的总结文案。

这个文案可以TTS，所以需要保证文案的质量。

---

## 📋 模块任务拆解 (Task List)

1. **基础设置**
   - 创建简单的测试脚本（如 `test-stt.js` 和 `test-llm.js`），加载 `.env` 环境变量配置 API 密钥（Deepgram / Gemini）。
2. **Deepgram 语音转文字 (STT) 联调**
   - 上传一段带环境底噪或随意的口语化短录音。
   - 微调 Deepgram API 参数（如增加标点处理、选择模型版本），得到高质量原始文本。
3. **Gemini 情感文案生成联调**
   - 编写高质量的 **System Prompt（提示词）**。告诉大模型它的身份是“一位专业而柔软的回忆收集者”。
   - 将上一步 STT 的产物丢给 Gemini，要求把杂乱随心的短语音片段润色成“一段优美、连贯且带入感强的散文短片”。
4. **异常情况联调**
   - 测试如果上传多个不连贯的文件（即一个 Entry 内有多段不同的录音），如何通过上下文关联将它们融合成一篇文章。

---

## ⚠️ 模块开发规则 (Rules)

- **环境隔离**：这里的代码不要带任何前端 React/UI 库，尽量是纯净的 TypeScript/Node.js 逻辑模块（或作为单纯的 API Route 函数测试）。
- **重在 Prompt 与参数调优**：这一步的核心在于让 AI 生成的文本不仅要“对”，还要“美”，请在这个文件夹重点保存各种版本的 Prompt 调试结果。

## 可用服务

### 1. Deepgram

可以访问这个地址进行调用确认，使用nova-2模型 <https://playground.deepgram.com/?endpoint=listen-streaming&endpointing=false&language=zh&model=nova-2>

### 2. Gemini

可以访问这个地址进行调用确认，使用模型可以是：

大语言模型
gemini-2.5-pro
gemini-3.1-flash-lite-preview

语音模型
gemini-3.1-flash-live-preview
gemini-2.5-flash-native-audio-preview-12-2025

TTS模型
gemini-2.5-flash-preview-tts
