# bg-removal（自托管切图资源）

运行 `npm run fetch:bg-removal` 下载 `@imgly/background-removal-data@1.7.0` 并裁剪为：

- `/models/isnet_quint8`（约 44MB）
- ONNX Runtime WASM（CPU + jsep/WebGPU）

合计约 **76MB**。大 chunk **不提交 git**；GitHub Pages / `build:web` / `android:sync` 会拉取。

`resources.json` 可提交，作为清单。缺失时应用回退到 IMG.LY CDN。
