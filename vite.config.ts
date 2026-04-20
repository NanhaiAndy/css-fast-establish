import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],

  build: {
    outDir: 'webview-dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/webview/main.ts')
      },
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          // 将 main.css 输出为 index.css
          if (assetInfo.name === 'main.css') {
            return 'index.css';
          }
          return 'assets/[name].[ext]';
        }
      }
    },

    minify: 'esbuild',
    target: 'es2015'
  },

  server: {
    port: 3000
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/webview')
    }
  }
});
