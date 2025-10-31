import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server: {
  //   port: 5173, // Cố định port ở đây
  //   strictPort: true, // Thêm dòng này để nếu port 5173 bận, nó sẽ báo lỗi thay vì tự đổi port
  // },
})
