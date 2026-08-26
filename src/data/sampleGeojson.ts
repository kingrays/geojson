import type { EditorFeatureCollection } from '../store/geojson'

// 初次打开时展示一组可直接编辑的示例建筑。
export const sampleGeoJson: EditorFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'building-a',
      properties: { name: '研发中心', category: '办公', floors: 6 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.4806, 31.2365],
            [121.4822, 31.2365],
            [121.4822, 31.2376],
            [121.4806, 31.2376],
            [121.4806, 31.2365],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'building-b',
      properties: { name: '展示中心', category: '展览', floors: 3 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.4827, 31.2352],
            [121.4843, 31.2352],
            [121.4843, 31.2362],
            [121.4827, 31.2362],
            [121.4827, 31.2352],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'building-c',
      properties: { name: '数据中心', category: '机房', floors: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [121.4802, 31.2345],
            [121.4817, 31.2345],
            [121.4817, 31.2355],
            [121.4802, 31.2355],
            [121.4802, 31.2345],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'main-gate',
      properties: { name: '园区主入口', category: '出入口' },
      geometry: {
        type: 'Point',
        coordinates: [121.48235, 31.2342],
      },
    },
  ],
}
