# RestClient

一个基于现代 Web 技术与 Rust 强力驱动的轻量级、高性能 REST API 交互工具。专为开发者打造，提供极致的 API 调试体验。

![RestClient](./RestClient.png)

## ✨ 特性

-   **�️ 原生桌面体验**: 基于 **Tauri 2.0** 构建，支持 Windows、macOS 和 Linux，相比传统 Electron 应用更轻量、内存占用更低。
-   **�🚀 全能请求构建**: 支持 GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS 等标准 HTTP 方法。内置 Query 参数解析器、Header 管理器及支持 JSON/Text 的 Body 编辑器。
-   **📂 智能文件夹管理**: 支持创建、重命名和删除文件夹。特有 **拖拽移动 (Drag & Drop)** 功能，可轻松在文件夹与历史记录间整理请求。
-   **🌓 完美深色模式**: 内置智能主题切换，支持跟随系统或手动切换深色/浅色皮肤。
-   **⚡ 实时响应反馈**: 毫秒级反馈响应状态、执行时长及数据大小。内置 **JSON 语法高亮** 的响应面板。
-   **🌐 多语言支持**: 完美支持 **中英文 (Chinese/English)** 一键切换。
-   **🎨 增强响应预览**: 自动识别响应内容，支持 **Markdown 渲染** 以及 **图片、音频、视频** 等二进制文件的直接预览与播放。
-   **💾 桌面端特供增强**:
    -   **文件下载**: 支持将 API 响应保存为本地文件。
    -   **一键定位**: 下载成功后，支持直接在文件管理器中定位到保存的文件。
    -   **高性能协议栈**: 桌面端请求底层由 Rust 的 `reqwest` 驱动，绕过浏览器跨域 (CORS) 限制。

## 🛠️ 技术架构

本项目采用全栈现代技术开发：

-   **桌面后端**: [Tauri 2.0](https://tauri.app/) & [Rust](https://www.rust-lang.org/) (系统级安全与速度)
-   **前端框架**: [React 19](https://react.dev/) (并发渲染)
-   **语言**: [TypeScript](https://www.typescriptlang.org/)
-   **构建**: [Vite 6](https://vitejs.dev/)
-   **样式**: [Tailwind CSS](https://tailwindcss.com/)

## 🏁 快速开始

### 准备工作

确保你的开发机器上已安装：
- [Node.js](https://nodejs.org/) (建议版本 v18.0.0+)
- [Rust & Cargo](https://www.rust-lang.org/learn/get-started) (编译桌面版必须)
- [pnpm](https://pnpm.io/)

### 开发 & 构建

1.  **克隆代码仓库**
    ```bash
    git clone https://github.com/wumacms/RestClient.git
    cd RestClient
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    ```

3.  **运行开发模式**
    -   **浏览器版**: `pnpm run dev` (访问 http://localhost:3000)
    -   **桌面端 (Debug)**: `pnpm tauri dev`

4.  **构建发行版 (桌面端)**
    ```bash
    pnpm tauri build
    ```
    安装包生成在 `src-tauri/target/release/bundle/` 目录下。

## 🏗️ 桌面端与 Web 端的关系

本项目采用 **Tauri** 架构，桌面端与 Web 端是深度继承与协作的关系：

-   **核心 UI 共享**: 桌面端与 Web 端共用一套 React 源码。你在浏览器中看到的界面与桌面应用显示的界面完全一致。
-   **混合开发模式**:
    -   **Web 端**负责业务逻辑和界面呈现。
    -   **Rust (Tauri)** 负责提供原生系统能力（如文件系统、窗口控制、绕过跨域限制的网络请求）。
-   **构建依赖**: 桌面端的构建流程依赖于 Web 端的产物。在打包桌面应用前，系统会自动运行 `vite build` 将前端代码编译并嵌入到原生程序中。
-   **环境自适应**: 代码中通过 `isTauri()` 等逻辑实现环境感知。在桌面端会自动开启高级功能（如一键定位文件），而在浏览器中则自动降级为标准 Web 行为。

## 📜 许可证

本项目遵循 [MIT](./LICENSE) 开源协议。

---
Created by **WumaCMS** · 持续迭代中...
