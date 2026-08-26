# GeoJSON Studio

一个使用 React、TypeScript、Leaflet 和 pnpm 构建的浏览器端 GeoJSON 展示与编辑工具。

## 功能

- 地图、JSON 文本和属性表双向同步
- 绘制、拖动、编辑和删除点、线、面
- 打开本地 `.geojson` / `.json` 文件并下载保存
- GeoJSON 结构校验、JSON 格式化和错误提示
- 要素属性增删改、选择与地图高亮
- 自动保存浏览器本地草稿
- 桌面端双栏及移动端上下布局

## 开发

```bash
pnpm install
pnpm dev
```

## 质量检查

```bash
pnpm lint
pnpm test
pnpm build
```

地图底图使用 OpenStreetMap 在线瓦片，首次加载地图时需要网络连接。
