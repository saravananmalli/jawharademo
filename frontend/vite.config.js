import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import compression from 'vite-plugin-compression'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    // Gzip for broad CDN/server support
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    // Brotli for modern browsers (smaller than gzip by ~15-20%)
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
  ],
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
    // Inline assets smaller than 4 KB as base64 to save round trips
    assetsInlineLimit: 4096,
    // CSS code splitting per-chunk (default true in Vite, made explicit)
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Core React runtime — always needed
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/'))
            return 'vendor-react';
          // Admin-only heavy analytics libs — lazy loaded via admin routes
          if (id.includes('@mui/x-charts') || id.includes('@mui/x-data-grid'))
            return 'vendor-admin-charts';
          // Recharts also admin-only
          if (id.includes('recharts') || id.includes('victory-'))
            return 'vendor-admin-charts';
          // MUI icons — large, separate so it doesn't bloat the main MUI chunk
          if (id.includes('@mui/icons-material'))
            return 'vendor-mui-icons';
          // MUI core + Emotion
          if (id.includes('@mui/') || id.includes('@emotion/'))
            return 'vendor-mui';
          // Swiper
          if (id.includes('swiper'))
            return 'vendor-swiper';
        },
      },
    },
  },
})
