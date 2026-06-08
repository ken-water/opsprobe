import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const workspaceRoot = resolve(import.meta.dirname, "..");
const entry = resolve(workspaceRoot, "src/main.ts");
const outfile = resolve(workspaceRoot, "dist/main.mjs");
const tauriResourceOutfile = resolve(workspaceRoot, "../desktop/src-tauri/resources/local-service/main.mjs");

await mkdir(dirname(outfile), { recursive: true });

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: false,
  minify: false,
  legalComments: "none",
  banner: {
    js: "import { createRequire as __opsprobeCreateRequire } from 'node:module'; const require = __opsprobeCreateRequire(import.meta.url);",
  },
});

await mkdir(dirname(tauriResourceOutfile), { recursive: true });
await copyFile(outfile, tauriResourceOutfile);

console.log(`Bundled local service runtime to ${outfile}`);
console.log(`Copied bundled local service runtime to ${tauriResourceOutfile}`);
