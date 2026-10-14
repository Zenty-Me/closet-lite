# bg-removal（自托管切图资源）

运行 `npm run fetch:bg-removal` 下载 `@imgly/background-removal-data@1.7.0` 并裁剪为：

- `/models/isnet_quint8`（约 44MB）
- ONNX Runtime WASM（CPU + jsep/WebGPU）

合计约 **76MB**。大 chunk **不提交 git**；GitHub Pages / `build:web` / `android:sync` 会拉取。

Chunk 文件名带 **`.bin` 后缀**（`resources.json` 的 `name` 同步）。Capacitor Android 的 html5mode 会把无扩展名路径当成 SPA 路由返回 `index.html`，无后缀时去背景必然失败。

`resources.json` 可提交，作为清单。缺失时网页端回退到 IMG.LY CDN；原生端不回退 CDN。
