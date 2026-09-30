import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// 生产构建发布到 GitHub Pages 项目站点 https://<user>.github.io/geojson/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/geojson/' : '/',
  plugins: [react()],
}))
