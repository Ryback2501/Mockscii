import { defineConfig } from 'vite';

// Base path matches the GitHub Pages project URL: https://<user>.github.io/Mockscii/
export default defineConfig({
  base: '/Mockscii/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
