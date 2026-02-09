# 技术文档：Tauri 桌面端应用请求本地服务 (Localhost) 被 VPN/代理拦截的问题修复

## 1. 问题描述
在开发基于 Tauri 的桌面端 RestClient 时，发现一个严重的网络请求问题：
- **表现**：当用户电脑开启 VPN 或系统全局代理时，访问 `http://localhost:*` 或 `http://127.0.0.1:*` 会持续返回 `503 Service Unavailable` 错误。
- **差异性**：相同的请求在 Web 端（浏览器）或专业的 REST 客户端（如 Postman）中可以成功，但在 Tauri 应用中失败。
- **特征**：响应头中通常会出现 `proxy-connection: close`，且响应体为空。

## 2. 根源分析
### 2.1 Tauri 网络栈机制
Tauri 的 `@tauri-apps/plugin-http` 插件在底层调用 Rust 的 `reqwest` 库。与浏览器原生的 `fetch` 不同，`reqwest` 默认会读取系统的全局环境变量和代理配置。

### 2.2 VPN 拦截原理
许多 VPN 或代理软件（如 ClashX, Surge 等）在开启“增强模式”或“全局代理”时，会将所有出站流量重定向到代理服务器。如果代理服务器没有配置 `localhost` 绕过，它会尝试解析并代理这些本地请求，由于代理服务器无法访问用户本地的端口，最终返回 503 错误。

### 2.3 专业工具的优势
Postman、Insomnia 等工具之所以能成功，是因为它们在底层网络库中内置了智能逻辑，或者显式配置了“对 localhost 禁用代理”的参数，从而绕过了系统代理的干扰。

## 3. 解决方案：智能“双栈”回退策略
为了在不要求用户手动修改 VPN 配置的情况下解决此问题，我们在 `requestService.ts` 中实现了一套智能识别与自动回退机制。

### 核心代码逻辑：
```typescript
// 1. 正常使用 Tauri 原生网络栈发起请求，获取最佳的跨域支持
try {
  res = await tauriFetch(targetUrl, options);
  
  // 2. 智能监测：如果请求的是 localhost 且触发了 503 错误
  if (res.status === 503 && isLocalhost) {
    console.warn('[Request] 检测到 localhost 503 错误，可能是 VPN/代理拦截。正在尝试绕过策略...');
    
    // 3. 自动回退：改用 WebView 内部的原生 fetch
    // Web 视图内部的 fetch 通常会自动绕过系统代理访问本地地址
    try {
      const nativeRes = await fetch(req.url, options);
      res = nativeRes;
      console.log('[Request] 成功使用原生 Fetch 绕过代理！');
    } catch (nativeErr) {
      // 如果原生 fetch 因为 CORS 失败，则保留原始 503
      console.error('[Request] 原生回退失败（可能受 CORS 限制）');
    }
  }
}
```

## 4. 实施效果
- **开箱即用**：用户无需关闭 VPN 即可调试本地 API 服务。
- **智能兼容**：在外网环境下依然保持 Tauri 原生网络栈的强大功能（如绕过 CORS 限制）。
- **专业级体验**：使应用的网络请求鲁棒性达到了专业调试工具的水准。

## 5. 后续维护建议
- 建议在 UI 界面提供“强制使用原生 Fetch”或“禁用代理”的开关，供高级用户在极端网络环境下微调。
- 确保护送的 `User-Agent` 与主流浏览器一致，以避免某些本地服务（如 Webpack Dev Server）的过滤。
