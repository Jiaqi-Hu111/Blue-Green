import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, parse } from "node:path";
const base = "/Blue-Green/";
export default defineConfig(({ command }) => {
  const candidate =
    process.env.GITHUB_SHA ||
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (!/^[a-f0-9]{40}$/i.test(candidate))
    throw new Error("A full Git SHA is required for deployment versioning.");
  const sha = candidate.toLowerCase(),
    images = {},
    outputs = [];
  if (command === "build")
    for (const name of readdirSync(resolve("public/images"))) {
      const source = readFileSync(resolve("public/images", name));
      const { name: stem, ext } = parse(name);
      const hash = createHash("sha256")
        .update(source)
        .digest("hex")
        .slice(0, 12);
      const fileName = `assets/${stem}-${hash}${ext}`;
      images[`images/${name}`] = `${base}${fileName}`;
      outputs.push({ type: "asset", fileName, source });
    }
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "bluegreen-release",
        transformIndexHtml() {
          return [
            {
              tag: "meta",
              attrs: { name: "bluegreen-build", content: sha },
              injectTo: "head",
            },
          ];
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "version.json",
            source: JSON.stringify({ schema: 1, sha }) + "\n",
          });
          for (const asset of outputs) this.emitFile(asset);
        },
      },
    ],
    define: {
      __BUILD_SHA__: JSON.stringify(sha),
      __IMAGE_ASSETS__: JSON.stringify(images),
    },
  };
});
