# RC Rest Client

一个基于现代 Web 技术的轻量级、高性能 REST API 交互工具。专为开发者打造，提供极致的 API 调试体验。

![RC Rest Client](./RestClient.png)

## ✨ 特性

-   **🚀 全能请求构建**: 支持 GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS 等标准 HTTP 方法。内置 Query 参数解析器、Header 管理器及支持 JSON/Text 的 Body 编辑器。
-   **📂 智能文件夹管理**: 支持创建、重命名和删除文件夹。特有 **拖拽移动 (Drag & Drop)** 功能，可轻松在文件夹与历史记录间整理请求。
-   **🌓 完美深色模式**: 内置智能主题切换，支持跟随系统或手动切换深色/浅色皮肤，采用精心设计的深色调平衡。
-   **⚡ 实时响应反馈**: 毫秒级反馈响应状态、执行时长及数据大小。内置 **JSON 语法高亮** 的响应面板，支持一键复制。
-   **🌐 多语言支持**: 完美支持 **中英文 (Chinese/English)** 一键切换，满足全球开发者的使用习惯。
-   **🎨 增强响应预览**: 自动识别响应内容，支持 **Markdown 渲染** 以及 **图片、音频、视频** 等二进制文件的直接预览与播放。
-   **💾 自动持久化 & 导入导出**: 基于浏览器 LocalStorage 实现数据自动保存，支持将项目配置（文件夹及请求）导出为 JSON 文件进行备份或跨设备迁移。
-   **📱 极致响应式**: 采用适配化布局设计，无论是桌面端、平板还是移动端，均能提供一致且流畅的操作体验。

## 🛠️ 技术架构

本项目采用当前前端领域最尖端的技术栈：

-   **框架**: [React 19](https://react.dev/) (最新的并发渲染与性能优化)
-   **语言**: [TypeScript](https://www.typescriptlang.org/) (全栈类型定义，零配置类型推导)
-   **构建**: [Vite 6](https://vitejs.dev/) (极致的启动速度与热更新)
-   **样式**: [Tailwind CSS](https://tailwindcss.com/) (响应式布局与深色模式支持)
-   **图标**: [Lucide React](https://lucide.dev/) (干净、一致的矢量图形)

## 🏁 快速开始

### 准备工作

确保你的开发机器上已安装：
- [Node.js](https://nodejs.org/) (建议版本 v18.0.0+)
- [npm](https://www.npmjs.com/)

### 安装步骤

1. **克隆代码仓库**
   ```bash
   git clone https://github.com/wumacms/RestClient.git
   cd RestClient
   ```

2. **安装项目依赖**
   ```bash
   pnpm install
   ```

3. **开启开发模式**
   ```bash
   pnpm run dev
   ```

4. **立即调试**
   在浏览器中打开：`http://localhost:3000`

## 📂 源码目录说明

- `components/`: 包含 `Sidebar` (侧边栏管理), `RequestEditor` (请求编辑器), `ResponsePanel` (响应展示) 等核心组件。
- `utils/`: 包含 ID 生成、字节格式化、颜色映射等辅助函数，以及多语言国际化配置。
- `types.ts`: 定义了 `AppState`, `RequestItem`, `Folder` 等完整的接口类型。
- `App.tsx`: 应用的入口点，负责全局状态管理、网络请求逻辑及主题切换。

## 📜 许可证

本项目遵循 [MIT](./LICENSE) 开源协议。

---
Created by **WumaCMS** · 持续迭代中...
