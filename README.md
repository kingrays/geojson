# GeoJSON Studio

一个使用 React、TypeScript、Leaflet 和 pnpm 构建的浏览器端 GeoJSON 展示与编辑工具。

## 功能

- 地图、JSON 文本和属性表双向同步
- 绘制、拖动、编辑和删除点、线、面
- **底图切换**：OpenStreetMap、天地图、高德、百度（需本地配置 API Key）
- **用途平台与坐标对齐**：按目标地图平台保存/导出坐标，叠加国内底图不偏移
- 打开本地 `.geojson` / `.json` 文件并下载保存
- GeoJSON 结构校验、JSON 格式化和错误提示
- 要素属性增删改、选择与地图高亮
- 自动保存浏览器本地草稿
- 桌面端双栏及移动端上下布局

## 用途平台说明

| 用途平台 | 导出坐标系 | 可选底图 |
| --- | --- | --- |
| 天地图 / 高德 | GCJ-02 | 天地图矢量/影像、高德标准/卫星 |
| 百度 | BD-09 | 百度标准/卫星 |
| 国际标准 | WGS84 | OpenStreetMap |

导出文件根级包含 `"coordSys"` 字段，便于其他项目识别坐标系。

**注意**：底图列表会随「用途平台」过滤（例如选百度时不会出现高德/天地图）。底图切换仅影响预览样式；导出坐标系由「用途平台」决定。

百度底图使用专用地图投影（依赖 `proj4leaflet`），切换至百度底图时地图会自动切换坐标系。

## 国内底图 API Key

切换到天地图、高德或百度底图时，需先在 [天地图开放平台](https://lbs.tianditu.gov.cn/)、[高德开放平台](https://lbs.amap.com/)、[百度地图开放平台](https://lbsyun.baidu.com/) 申请 Key。Key 仅保存在浏览器 localStorage，不会上传。

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

在线底图（含 OSM 与国内地图瓦片）首次加载时需要网络连接。
