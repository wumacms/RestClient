# RC Rest Client

一个基于现代 Web 技术的轻量级、高性能 REST API 交互工具。专为开发者打造，旨在提供极致的 API 调试体验。

![RC Rest Client Mockup](https://raw.githubusercontent.com/wumacms/RestClient/main/screenshot_placeholder.png)

## ✨ 特性

-   **🚀 高效请求构建**: 全面支持 GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS 等 HTTP 方法，轻松配置 URL、自定义 Header 和 Request Body。
-   **📂 智能文件夹管理**: 强大的组织能力，支持创建文件夹、在文件夹间移动请求，让你的 API 库井然有序。
-   **⚡ 实时响应反馈**: 毫秒级的响应反馈，清晰展示状态码、执行时长、数据大小及完整的 Response Headers。
-   **🎨 现代美观 UI**: 采用精心设计的玻璃拟态皮肤（Glassmorphism）和深浅色调平衡，提供卓越的视觉体验与交互手感。
-   **💾 本地持久化储存**: 深度集成浏览器 LocalStorage，即使刷新或重启浏览器，你的调试记录也永不丢失。
-   **☁️ 无缝迁移**: 支持一键备份完整项目配置到 JSON 文件，轻松实现跨设备同步。

## 🛠️ 技术架构

本项目代表了现代前端开发的最佳实践：

-   **框架**: React 19 (享受最新的并发渲染特性)
-   **语言**: TypeScript (严格类型系统，卓越的开发体验)
-   **构建**: Vite 6 (极致冷启动速度与热更新)
-   **样式**: Tailwind CSS (原子化设计，响应式布局)
-   **图标**: Lucide React (像素级精美矢量图标)

## 🏁 快速开始

### 准备工作

确保你的开发机器上已安装：
- [Node.js](https://nodejs.org/) (建议版本 v18.0.0+)
- [npm](https://www.npmjs.com/) 或 [pnpm](https://pnpm.io/)

### 安装步骤

1. **克隆代码仓库**
   ```bash
   git clone https://github.com/wumacms/RestClient.git
   cd RestClient
   ```

2. **安装项目依赖**
   ```bash
   npm install
   ```

3. **开启开发模式**
   ```bash
   npm run dev
   ```

4. **立即调试**
   在浏览器中打开：`http://localhost:5173`

## 📂 源码目录说明

- `components/`: 包含 `RequestEditor`、`Sidebar` 和 `ResponsePanel` 等高度解耦的 UI 组件。
- `utils/`: 精心编写的辅助函数，如 ID 生成、字节格式化等。
- `types.ts`: 完整的接口类型定义，驱动全栈类型推导。
- `App.tsx`: 应用的核心状态机与布局逻辑。

## 📜 许可证

本项目遵循 [MIT](./LICENSE) 开源协议。

---
Created by **WumaCMS** · 持续迭代中...
