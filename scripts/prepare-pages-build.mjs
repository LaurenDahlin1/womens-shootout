#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalUrl, faqPageJsonLd, pages } from "../src/siteMeta.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "index.html");

if (!existsSync(index)) {
  throw new Error("Missing Vite build output: dist/index.html");
}

const homeHtml = readFileSync(index, "utf8");

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}

function applyPageMeta(html, pathname) {
  const meta = pages[pathname];
  const url = canonicalUrl(pathname);
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${description}$2`,
  );
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`);
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${description}$2`,
  );
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${description}$2`,
  );

  const pageJsonLd =
    pathname === "/faq"
      ? `<script type="application/ld+json">${JSON.stringify(faqPageJsonLd)}</script>`
      : "";
  html = html.replace("<!--page-jsonld-->", pageJsonLd);
  return html;
}

writeFileSync(index, applyPageMeta(homeHtml, "/"));

for (const route of ["faq", "founders", "more-events", "contact"]) {
  const dir = path.join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), applyPageMeta(homeHtml, `/${route}`));
}

copyFileSync(index, path.join(dist, "404.html"));
writeFileSync(path.join(dist, ".nojekyll"), "");

console.log("Prepared GitHub Pages build: faq/, founders/, more-events/, contact/, 404.html");
