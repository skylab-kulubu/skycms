import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.js",
    server: "src/server/get-content.js",
    actions: "src/server/actions.js",
    page: "src/server/cms-page.jsx",
    "cli-sync": "src/cli/sync.js",
    "auth-server": "src/auth/server/index.js",
    "auth-server-signin": "src/auth/server/signin.js",
    "auth-client": "src/auth/client/index.jsx",
  },
  format: ["esm"],
  splitting: true,
  sourcemap: true,
  clean: true,
  // Babel parser/traverse: heavy CJS modules used only by the cms-sync CLI
  // and the discover helper. Leave them external so tsup doesn't bundle them
  // (would explode dist size and break the @babel/traverse interop trick).
  external: [
    "react", "react-dom", "next", "next-auth",
    "server-only", "client-only",
    "@babel/parser", "@babel/traverse",
  ],
});
