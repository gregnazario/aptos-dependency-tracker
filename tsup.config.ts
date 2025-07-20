import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  outDir: "dist",
  format: ["esm"],
  minify: true,
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  splitting: false,
  shims: true,
  bundle: true,
  banner: {
    js: `#!/usr/bin/env node`,
  },
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    // Optionally customize esbuild options here
  },
});
