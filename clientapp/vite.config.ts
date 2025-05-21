import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from 'path'
import devtoolsJson from 'vite-plugin-devtools-json';

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
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    }
  },
  plugins: [devtoolsJson(), tailwindcss(), reactRouter(), tsconfigPaths()],
});
