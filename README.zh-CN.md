# JSON-LD Checker

[![CI](https://github.com/simonguo/json-ld-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/simonguo/json-ld-checker/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)

JSON-LD Checker 是一款开源 Chromium 浏览器扩展，用于在当前页面直接检查、验证和改进 JSON-LD 结构化数据。界面遵循 Chrome DevTools 的交互习惯，方便开发者快速浏览 Schema、定位问题和检查源码。

[English](README.md)

## 功能

- 自动检测当前页面中的 JSON-LD，并在扩展图标中显示状态。
- 提供 Inspector、Issues、History 三个 DevTools 风格主视图。
- 支持多个 Schema 切换，并通过 `@type` 识别数据类型。
- 为嵌套对象、数组和 `@graph` 生成准确的 JSONPath。
- 点击问题即可回到 Inspector 定位；字段缺失时定位到最近存在的父节点。
- Source 编辑器仅维护本地草稿，不会修改网页内容。
- 支持导出 JSON-LD 和验证报告。
- 可选接入 OpenAI、Anthropic、Gemini、Azure OpenAI、OpenRouter、DeepSeek、千问、Kimi、智谱 GLM、MiniMax、Ollama 和自定义 OpenAI 兼容端点。
- 支持英文和简体中文。

## 环境要求

- Chrome 114+、Microsoft Edge 114+ 或兼容的 Chromium 浏览器。
- 本地开发需要 Node.js 20.19+ 和 npm 10+。

## 从源码安装

```bash
git clone https://github.com/simonguo/json-ld-checker.git
cd json-ld-checker
npm ci
npm run build
```

然后打开 `chrome://extensions` 或 `edge://extensions`，启用开发者模式，选择“加载已解压的扩展程序”，并选中生成的 `dist/` 目录。

## 开发命令

```bash
npm run dev          # 启动扩展开发环境
npm run dev:visual   # 启动侧边栏视觉调试页
npm run type-check   # TypeScript 类型检查
npm test             # 运行 Vitest 测试
npm run build        # 生产构建
npm run licenses     # 更新第三方软件许可声明
npm run check        # 执行完整 CI 检查
```

本地 JSON-LD 测试页面位于 `tests/fixtures/`。

## AI 与隐私

AI 功能完全可选。API Key 保存在 Chrome 扩展本地存储中；使用 AI 功能时，相关页面信息会直接发送给用户选择的模型服务商。本项目不包含分析统计或遥测代码。详细说明见 [PRIVACY.md](PRIVACY.md)。

扩展需要访问页面 URL，以便在当前标签页中读取 JSON-LD。内置校验、历史记录和本地草稿均在浏览器本地处理。

## 参与贡献

提交 Issue 或 Pull Request 前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全问题请根据 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

本项目使用 [MIT License](LICENSE)。打包依赖及其许可声明见
[THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt)。
