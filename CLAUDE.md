# CLAUDE.md — 轻衣橱 (qing-yichu)

给后续 Claude / 自动化代理用的项目说明。改代码前先读本文件与 `DESIGN.md`。

## Product

- **Name:** 轻衣橱  
- **Tagline:** 本地电子衣橱，数据只存在你的手机里  
- **Inspiration:** 无忧衣橱类 digital closet，**不要**抄商标/品牌视觉  
- **Audience:** 手机浏览器 / 可安装 PWA  
- **Privacy:** 完全本地优先；v1–当前无账号、无后端、无云同步  

## URLs

| | |
|--|--|
| Repo | https://github.com/Zenty-Me/qing-yichu |
| Live Pages | https://zenty-me.github.io/qing-yichu/ |
| Owner | GitHub user `Zenty-Me` |

## Stack

- Vite + React + TypeScript  
- `vite-plugin-pwa`（manifest + service worker）  
- `idb` → IndexedDB  
- React Router **`HashRouter`**（适配 GitHub Project Pages）  
- Vite `base: '/qing-yichu/'`  
- Deploy: `.github/workflows/deploy.yml` → GitHub Pages (Actions)  

## Architecture

```
src/
  pages/        # 衣橱、搭配、灵感、日历、我的、回收站、表单/详情
  components/   # BottomNav、ItemCard、ImageEditor、BatchEditSheet…
  db/index.ts   # IndexedDB 封装（当前 DB_VERSION = 3）
  types/        # 领域类型 + normalize* + BackupData v1–v3
  utils/        # image / cutout / settings / wearStats / suggest / wardrobeQuery…
  hooks/        # useBlobUrl
```

### IndexedDB (`qing-yichu`)

| Version | Change |
|---------|--------|
| 1 | stores: `items`, `outfits`, `wearLogs` |
| 2 | + `inspirations` |
| 3 | soft fields: `originalBlob`（单品）、`coverBlob`（搭配）；靠 `normalize*` 读旧数据 |

Stores: `items`, `outfits`, `wearLogs`, `inspirations`. Soft-delete via `deletedAt`.

### Backups (我的 → 导出/导入)

- Export **v3**（含原图、拼图封面、灵感等）  
- Import accepts **v1 / v2 / v3**  

Settings（季节模式等）存在 **localStorage** key `qing-yichu-settings`，不进备份也可接受。

## Features already shipped

- **衣橱:** 拍照/相册、压缩 JPEG、富字段（品牌/价格/尺码/收纳/标签/购买日）、搜索筛选排序、季节模式、穿着次数徽章、今日可穿、**批量导入（≤30）**、**多选批量改属性 / 移入回收站**  
- **图片:** 旋转、拖选裁剪、`ImageEditor`；**去背景** = `@imgly/background-removal` **CDN ESM**（首次需联网下模型；失败 toast，不崩应用）；`originalBlob` 可恢复  
- **搭配:** 多选单品、详情、随机搭配、竖向拼图 `coverBlob`  
- **灵感:** 独立 Tab，相册/拍照 + 备注标签  
- **日历:** 月/周视图、搭配或单品记录、天气文案、可选穿搭照  
- **我的:** 统计、穿着洞察、季节设置、回收站入口、备份 v3、清空数据、PWA 安装说明  
- **回收站:** 软删除恢复 / 永久删除 / 清空  

## Design system（必守）

详见 `DESIGN.md`。**禁止**退回紫色 AI SaaS 风（`#7c6af2` / `#f7f5ff` / 糖果圆角阴影）。

- Paper `#F3EFE7` · surface `#FFFBF5` · ink `#1C1916` · muted `#6E675E` · line `#DDD5C8`  
- Accent **deep olive** `#3D4A2E` · soft `#E4E8DB`  
- Titles: Noto Serif SC；UI: Noto Sans SC / PingFang  
- 照片优先；少装饰；`prefers-reduced-motion`  

改视觉时遵循 frontend-design skill：先写短 plan，自检不是 generic AI 默认盘。

## Run / deploy

```bash
cd /workspace/qing-yichu   # or clone path
npm install
npm run dev                # local
npm run build              # must pass before push
```

Push `main` → Actions → https://zenty-me.github.io/qing-yichu/  
（首屏若被旧 SW 缓存，硬刷新或重开 PWA。）

## Iteration priorities / gaps vs 无忧衣橱

**Done-ish for local MVP.** Still out / later:

- 完全离线的去背景（需自托管 ONNX/WASM）  
- 自由拖拽拼图编辑器 / 贴纸文字  
- 批量导入后的列表内联编辑增强  
- 洗衣提醒、购物清单、深度统计图表  
- 账号与云同步（若做，须可选且默认本地）  

## Conventions

- **UI copy:** 中文；产品名保持「轻衣橱」  
- **Commits:** 简洁英文 `feat:` / `fix:` / `style:`；schema 变更写清 DB/backup version  
- **Migrations:** 升 `DB_VERSION`；旧字段用 `normalize*` 默认；备份升版本且 **继续能 import 旧版**  
- **Heavy libs:** 优先 dynamic import / CDN，避免把数十 MB WASM 打进 Pages  
- **No backend** unless product explicitly changes  
- Claude Code：`.claude/settings.json` 已用 **acceptEdits** + 全工具 `allow`（deny 空）。  
  注意：Claude Code **不会**从 project/local 生效 `bypassPermissions`；若要完全跳过提示，请在用户级 `~/.claude/settings.json` 设 `"defaultMode": "bypassPermissions"`，或启动时加 `--dangerously-skip-permissions` / `--permission-mode bypassPermissions`。可参考 `.claude/settings.local.json.example`  

## Quick “how to use” — 批量编辑（刚加）

1. 衣橱 → 点「选择」  
2. 点选多件（勾选）、「全选当前列表」/「清空选择」  
3. 底栏：「批量修改」|「移入回收站」|「取消」  
4. 批量修改：勾选要改的字段 →「应用到 N 件」  
5. 批量导入后 toast 会提示可用「选择」整理分类/季节  
