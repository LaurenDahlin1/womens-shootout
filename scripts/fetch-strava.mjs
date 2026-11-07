#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, rootDir } from "./env.mjs";

loadEnv();

const EVENTS_PATH = path.join(rootDir, "public/data/events.json");
const CLUBS = [
  { id: "1245841", name: "Women’s Shootout", kind: "shootout" },
  { id: "1306157", name: "Monthly Women’s Ride", kind: "sister" },
  { id: "1489581", name: "Ladies on Lemmon", kind: "sister" },
];

function readExisting() {
  if (!existsSync(EVENTS_PATH)) {
    return { fetchedAt: null, upcoming: [], additionalShootout: [], sisterClubEvents: [] };
  }
  return JSON.parse(readFileSync(EVENTS_PATH, "utf8"));
}

function writeEvents(payload) {
  writeFileSync(EVENTS_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function persistRefreshToken(token) {
  const out = process.env.STRAVA_REFRESH_TOKEN_OUT;
  if (!out || !token) return;
  writeFileSync(out, token);
}

function sanitizeDescription(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function nextStart(event) {
  const now = Date.now();
  const occurrences = Array.isArray(event.upcoming_occurrences)
    ? event.upcoming_occurrences
    : [];
  const future = occurrences
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value) && value >= now)
    .sort((a, b) => a - b);
  if (future.length) return new Date(future[0]).toISOString();

  const start = event.start_date || event.upcoming_occur_date;
  if (!start) return null;
  const time = new Date(start).getTime();
  if (!Number.isFinite(time) || time < now) return null;
  return new Date(time).toISOString();
}

function toPublicEvent(event, club) {
  if (event?.private === true) return null;
  const startsAt = nextStart(event);
  if (!startsAt) return null;

  const id = String(event.id ?? `${club.id}-${startsAt}`);
  return {
    id,
    clubName: club.name,
    title: String(event.title || event.name || "Group ride").trim(),
    startsAt,
    timezone: event.timezone || "America/Phoenix",
    description: sanitizeDescription(event.description),
    stravaUrl: `https://www.strava.com/clubs/${club.id}/group_events/${event.id}`,
    isWomenOnly: event.women_only === true || club.kind === "shootout",
  };
}

async function refreshAccessToken() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REFRESH_TOKEN");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(`Strava token refresh failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  persistRefreshToken(payload.refresh_token);
  return payload.access_token;
}

async function fetchClubEvents(accessToken, club) {
  const url = new URL(`https://www.strava.com/api/v3/clubs/${club.id}/group_events`);
  url.searchParams.set("upcoming", "true");
  url.searchParams.set("per_page", "50");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Strava club ${club.id} failed: ${response.status} ${text}`);
  }
  const events = await response.json();
  if (!Array.isArray(events)) return [];
  return events
    .map((event) => toPublicEvent(event, club))
    .filter(Boolean)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function splitEvents(byClub) {
  const shootout = byClub.get("1245841") ?? [];
  const upcoming = shootout.slice(0, 2);
  const additionalShootout = shootout.slice(2, 6);
  const sisterClubEvents = ["1306157", "1489581"].flatMap((id) => byClub.get(id) ?? []);
  sisterClubEvents.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { upcoming, additionalShootout, sisterClubEvents };
}

const existing = readExisting();

try {
  const accessToken = await refreshAccessToken();
  const byClub = new Map();
  for (const club of CLUBS) {
    byClub.set(club.id, await fetchClubEvents(accessToken, club));
  }
  const split = splitEvents(byClub);
  writeEvents({ fetchedAt: new Date().toISOString(), ...split });
  console.log(
    `Wrote events.json (${split.upcoming.length} upcoming, ${split.additionalShootout.length} more Shootout, ${split.sisterClubEvents.length} sister club)`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  if (existing.upcoming?.length || existing.additionalShootout?.length || existing.sisterClubEvents?.length) {
    console.error("Keeping last-known-good events.json");
    process.exit(0);
  }
  writeEvents({ fetchedAt: existing.fetchedAt, upcoming: [], additionalShootout: [], sisterClubEvents: [] });
  process.exit(1);
}
