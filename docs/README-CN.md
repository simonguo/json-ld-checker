# JSON-LD Checker

JSON-LD Checker 是一款 Chromium 浏览器扩展，可在浏览器侧边栏中直接检查、校验并可视化网页上的 JSON-LD 结构化数据。

## 亮点

- 自动检测任意页面中的 JSON-LD，并在工具栏图标上提示当前状态。
- 侧边栏提供多种视图：可折叠树形结构、原始 JSON、校验摘要，以及 AI 辅助分析。
- 内置校验器：覆盖缺失字段、数据类型错误、URL 格式不合法，以及 SEO 相关建议。
- AI Check：解释现有标记中的问题；AI Suggest：即使页面没有 JSON-LD，也能生成可用于生产环境的 JSON-LD 草稿。
- UI 支持国际化：自动语言检测，并支持手动切换（System / English / 中文）。

## 安装

1. Clone 或下载本仓库。
2. 打开 `chrome://extensions`（或 `edge://extensions`），并启用 **开发者模式（Developer mode）**。
3. 点击 **加载已解压的扩展程序（Load unpacked）**，选择本项目目录。

可选：运行 `node create-icons.js` 重新生成图标（需要先 `npm install canvas`）。

## 快速开始

1. 打开任意网页，点击扩展图标并从中打开侧边栏。
2. 在不同标签页之间切换，查看树形结构、原始 JSON、校验结果、AI Check 或 AI Suggest。
3. 当检测到多个 JSON-LD 代码块时，可使用下拉框切换不同的块。

### 配置 AI

1. 点击 ⚙️ 按钮进入设置页。
2. 填入你的 OpenAI API Key，测试连接后保存。
3. AI 的返回内容会跟随当前选择的语言偏好。

## 开发说明

- 基于 Manifest V3 + 原生 JavaScript；无需构建步骤（no build step）。
- 源码大致包含：后台 worker、content script、side panel UI、校验器、AI 服务与设置页。
- 修改代码后，请在 `chrome://extensions` 中刷新扩展。

## 贡献与许可证

欢迎提交 Pull Request 与 Issue。

本项目以 MIT License 发布。
