import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.js",
    server: "src/server/get-content.js",
  },
  format: ["esm"],
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
});
