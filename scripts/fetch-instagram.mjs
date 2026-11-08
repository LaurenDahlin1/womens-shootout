#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, rootDir } from "./env.mjs";

loadEnv();

const DATA_DIR = path.join(rootDir, "public/data");
const MEDIA_DIR = path.join(DATA_DIR, "instagram");
const JSON_PATH = path.join(DATA_DIR, "instagram.json");
const PROFILE_URL = "https://www.instagram.com/womens.shootout.tucson/";
const HANDLE = "womens.shootout.tucson";
const MAX_POSTS = 6;
const FACEBOOK_GRAPH = "https://graph.facebook.com/v23.0";
const INSTAGRAM_GRAPH = "https://graph.instagram.com";

function isInstagramLoginToken(token) {
  return /^IGAA/i.test(token);
}

function graphBase(token) {
  return isInstagramLoginToken(token) ? INSTAGRAM_GRAPH : FACEBOOK_GRAPH;
}

function readExisting() {
  if (!existsSync(JSON_PATH)) {
    return { fetchedAt: null, handle: HANDLE, profileUrl: PROFILE_URL, posts: [] };
  }
  return JSON.parse(readFileSync(JSON_PATH, "utf8"));
}

function persistAccessToken(token) {
  const out = process.env.IG_ACCESS_TOKEN_OUT;
  if (!out || !token) return;
  writeFileSync(out, token);
}

function extensionFor(contentType, fallbackUrl) {
  const type = (contentType || "").split(";")[0].trim();
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "video/mp4") return ".mp4";
  const fromUrl = fallbackUrl?.split("?")[0].match(/\.(jpe?g|png|webp|mp4)$/i);
  return fromUrl ? `.${fromUrl[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

function altFromCaption(caption) {
  const text = (caption || "").replace(/\s+/g, " ").trim();
  if (!text) return "Women’s Shootout Tucson on Instagram";
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

async function refreshLongLivedToken(token) {
  if (!isInstagramLoginToken(token)) {
    return token;
  }
  const url = new URL(`${INSTAGRAM_GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    console.warn("Instagram token refresh skipped:", JSON.stringify(payload));
    return token;
  }
  persistAccessToken(payload.access_token);
  return payload.access_token;
}

async function downloadMedia(id, sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Instagram media ${id}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = extensionFor(response.headers.get("content-type"), sourceUrl);
  mkdirSync(MEDIA_DIR, { recursive: true });
  const filename = `${id}${ext}`;
  writeFileSync(path.join(MEDIA_DIR, filename), buffer);
  return `/data/instagram/${filename}`;
}

async function fetchMedia(token, userId) {
  const url = new URL(`${graphBase(token)}/${userId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count",
  );
  url.searchParams.set("limit", String(MAX_POSTS));
  url.searchParams.set("access_token", token);
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Instagram media fetch failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return Array.isArray(payload.data) ? payload.data : [];
}

function mediaSource(item) {
  if (item.media_type === "VIDEO" || item.media_type === "REELS") {
    return item.thumbnail_url || item.media_url;
  }
  return item.media_url || item.thumbnail_url;
}

const existing = readExisting();

try {
  const userId = process.env.IG_USER_ID;
  const startingToken = process.env.IG_ACCESS_TOKEN;
  if (!userId || !startingToken) {
    throw new Error("Missing IG_USER_ID or IG_ACCESS_TOKEN");
  }

  const token = await refreshLongLivedToken(startingToken);
  const items = await fetchMedia(token, userId);
  const posts = [];
  for (const item of items.slice(0, MAX_POSTS)) {
    const source = mediaSource(item);
    if (!item.id || !source) continue;
    const image = await downloadMedia(item.id, source);
    posts.push({
      id: String(item.id),
      image,
      alt: altFromCaption(item.caption),
      caption: item.caption || "",
      permalink: item.permalink || PROFILE_URL,
      timestamp: item.timestamp || null,
      likes: Number.isFinite(item.like_count) ? item.like_count : null,
      comments: Number.isFinite(item.comments_count) ? item.comments_count : null,
    });
  }

  writeFileSync(
    JSON_PATH,
    `${JSON.stringify({ fetchedAt: new Date().toISOString(), handle: HANDLE, profileUrl: PROFILE_URL, posts }, null, 2)}\n`,
  );
  console.log(`Wrote instagram.json (${posts.length} posts)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (existing.posts?.length) {
    console.error("Keeping last-known-good instagram.json");
    process.exit(0);
  }
  process.exit(1);
}
