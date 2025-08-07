import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from 'path'
import devtoolsJson from 'vite-plugin-devtools-json';
import ViteWebfontDownload from 'vite-plugin-webfont-dl';
import oxlintPlugin from 'vite-plugin-oxlint';

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, '/'),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:7777",
        ws: true,
      },
    },
    hmr: {
      overlay: true,
    }
  },
  css: {
    devSourcemap: true,
  },
  plugins: [
    oxlintPlugin(),
    tailwindcss(),
    devtoolsJson(),
    reactRouter(),
    tsconfigPaths(),
    ViteWebfontDownload([
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap',
      'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
    ], { injectAsStyleTag: true, async: false }),
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (chunkInfo: any) => chunkInfo.name === 'webfonts.css' ? 'assets/webfonts.css' : 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
