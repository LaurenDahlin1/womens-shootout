#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "index.html");

if (!existsSync(index)) {
  throw new Error("Missing Vite build output: dist/index.html");
}

for (const route of ["faq", "founders", "more-events", "contact"]) {
  const dir = path.join(dist, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(index, path.join(dir, "index.html"));
}

copyFileSync(index, path.join(dist, "404.html"));
writeFileSync(path.join(dist, ".nojekyll"), "");

console.log("Prepared GitHub Pages build: faq/, founders/, more-events/, contact/, 404.html");
