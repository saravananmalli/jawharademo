import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  // Pre-bundle heavy deps so Vite's cold-start transform is faster
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', 'swiper',
      '@emotion/react', '@emotion/styled',
    ],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('@mui/x-charts') || id.includes('@mui/x-data-grid')) return 'vendor-mui-x';
          if (id.includes('@mui/') || id.includes('@emotion/')) return 'vendor-mui';
          if (id.includes('swiper')) return 'vendor-swiper';
          if (id.includes('recharts')) return 'vendor-charts';
        },
      },
    },
  },
})
