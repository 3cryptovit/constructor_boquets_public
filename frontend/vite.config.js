import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // root: ".", // 📌 Корень проекта
  // publicDir: "public", // 📌 Явно указываем, где index.html
  // server: {
  //   port: 5174,
  //   strictPort: true,
  //   open: true, // 📌 Открывает браузер при запуске
  //   hmr: true,
  // },
  // build: {
  //   outDir: "dist",
  // },
});
