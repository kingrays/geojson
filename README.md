# GeoJSON Studio

一个使用 React、TypeScript、Leaflet 和 pnpm 构建的浏览器端 GeoJSON 展示与编辑工具。

## 功能

- 地图、JSON 文本和属性表双向同步
- 绘制、拖动、编辑和删除点、线、面
- **底图切换**：OpenStreetMap、天地图、高德、百度（需本地配置 API Key）
- **导出目标**：按高德、百度、天地图或国际标准保存坐标；底图可任意切换，预览自动对齐
- 打开本地 `.geojson` / `.json` 文件并下载保存
- GeoJSON 结构校验、JSON 格式化和错误提示
- 要素属性增删改、选择与地图高亮
- 自动保存浏览器本地草稿
- 桌面端双栏及移动端上下布局

## 导出目标说明

界面用产品名选择「导出给谁」，内部对应三套坐标：

- **高德**：导出 GCJ-02，默认高德底图
- **百度**：导出 BD-09，默认百度底图
- **天地图**：导出 WGS84（与 CGCS2000 / GPS 一致），默认天地图底图
- **国际标准**：导出 WGS84，默认 OpenStreetMap

天地图与国际标准使用同一套坐标；两者互切时不会转换数字，只换默认底图。

导出文件根级包含 `"coordSys"` 字段，便于其他项目识别坐标系。

**注意**：底图与导出目标相互独立。可在任意底图上绘制或核对，编辑器会在预览坐标与导出坐标之间自动转换。天地图 / OSM 预览用 WGS84；高德瓦片按 GCJ-02 切网，预览时会转成 GCJ-02 再叠加。给高德 App / JS API 使用时，请选择「导出给高德」。

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
