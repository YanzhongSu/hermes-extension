import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/inject',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/inject/extractPage.ts'),
      name: 'HermesPageExtractor',
      formats: ['iife'],
      fileName: () => 'extractPage.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
