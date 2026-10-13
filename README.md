# 轻衣橱

本地电子衣橱，数据只存在你的手机里。

灵感来自电子衣橱类产品，**轻衣橱** 是完全本地优先的开源 PWA：拍照建档、搭配组合、穿着日历，无需注册、无服务器、无云同步。

## 在手机上打开

1. 用手机浏览器访问：  
   **https://zenty-me.github.io/qing-yichu/**
2. 建议使用 Safari（iOS）或 Chrome（Android）。

## 添加到主屏幕（像 App 一样用）

### iPhone / iPad（Safari）
1. 打开上面的网址  
2. 点底部分享按钮  
3. 选择「添加到主屏幕」  
4. 确认名称「轻衣橱」后添加  

### Android（Chrome）
1. 打开上面的网址  
2. 点右上角菜单 ⋮  
3. 选择「添加到主屏幕」或「安装应用」  

安装后可离线打开壳页面；你的衣橱数据始终保存在本机。

## 功能（v1）

| 模块 | 能力 |
|------|------|
| **衣橱** | 拍照/相册添加单品，分类筛选，编辑删除 |
| **搭配** | 多选单品组成穿搭，标注场合 |
| **日历** | 月视图记录每天穿着，有记录的日期显示圆点 |
| **我的** | 数量统计、导出/导入 JSON 备份、清空数据、安装说明 |

图片会在保存前于浏览器内压缩（最长边约 1200px，JPEG 约 0.8），以控制 IndexedDB 体积。

## 隐私

- 全部数据（含照片 Blob）存储在浏览器 **IndexedDB**  
- v1 **不需要** 后端、登录或联网同步  
- 换机或清站点数据前，请先在「我的」里 **导出备份**

## 技术栈

- Vite + React + TypeScript  
- `vite-plugin-pwa`（Web App Manifest + Service Worker）  
- `idb`（IndexedDB）  
- React Router（底部 Tab）  
- GitHub Pages 静态托管  

## 本地开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

项目 Pages 的 `base` 为 `/qing-yichu/`。

## License

MIT
