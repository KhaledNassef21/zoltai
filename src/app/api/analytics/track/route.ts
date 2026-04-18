/**
 * Analytics tracking endpoint (v3 — Upstash + serverless-safe)
 *
 * Root-cause fix for the "Track analytics event" commit loop:
 *   • NO fs writes (Vercel filesystem is read-only outside /tmp)
 *   • NO GitHub API calls (stops the commit → deploy → commit feedback loop)
 *   • Optional fire-and-forget write to Upstash Redis via REST API
 *   • Bot/crawler filtering via User-Agent
 *   • In-memory per-IP rate limiting (secondary defense)
 *   • Aggressive field truncation to cap payload size
 *   • Always returns 200 — never breaks the user experience
 *
 * Env vars (optional — if absent, endpoint is a no-op 200):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime — edge has quirks with fire-and-forget fetch
export const runtime = "nodejs";
// Never cache analytics responses
export const dynamic = "force-dynamic";

// ─── Bot detection ──────────────────────────────────────────────
const BOT_UA =
  /bot|crawler|spider|slurp|mediapartners|bingpreview|facebookexternalhit|whatsapp|twitterbot|linkedinbot|embedly|discordbot|googlebot|yandex|baiduspider|duckduckbot|archive\.org|ia_archiver|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|gptbot|chatgpt-user|claude-web|perplexitybot|anthropic-ai|ccbot|google-extended|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pagespeed|pingdom|uptimerobot/i;

// ─── Per-instance rate limiter (in-memory) ──────────────────────
// Note: this is per serverless instance, not global — still useful as a
// first line of defense against rapid-fire events from a single visitor.
const RATE_LIMIT_MS = 500; // max 2 events/sec per IP per instance
const MAX_MAP_SIZE = 5000;
const lastSeen = new Map<string, number>();

function pruneMap(): void {
  const now = Date.now();
  const cutoff = now - 60_000;
  for (const [ip, ts] of lastSeen) {
    if (ts < cutoff) lastSeen.delete(ip);
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// ─── Upstash Redis writer (REST API, no SDK) ────────────────────
async function pushToUpstash(entry: Record<string, unknown>): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  // Abort after 1.5s so analytics never blocks the serverless container
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    // Pipeline: LPUSH event to list + LTRIM to cap at 10,000 most recent
    await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["LPUSH", "analytics:events", JSON.stringify(entry)],
        ["LTRIM", "analytics:events", "0", "9999"],
      ]),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    // Swallow — analytics must never break the user experience
  } finally {
    clearTimeout(timeout);
  }
}

// ─── POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Bot filter
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT_UA.test(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    // 2. Content-type guard (reject non-JSON quickly)
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json({ ok: true, skipped: "non-json" });
    }

    // 3. Per-IP rate limit
    const ip = getClientIp(req);
    const now = Date.now();
    const last = lastSeen.get(ip) || 0;
    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true, skipped: "rate-limited" });
    }
    lastSeen.set(ip, now);
    if (lastSeen.size > MAX_MAP_SIZE) pruneMap();

    // 4. Parse body safely
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: true, skipped: "bad-payload" });
    }

    const event = typeof body.event === "string" ? body.event.trim() : "";
    if (!event) {
      return NextResponse.json({ ok: true, skipped: "no-event" });
    }

    // 5. Build truncated entry (cap size to prevent abuse)
    const entry = {
      event: event.slice(0, 64),
      variant:
        typeof body.variant === "string" ? body.variant.slice(0, 1000) : "",
      page: typeof body.page === "string" ? body.page.slice(0, 512) : "",
      ua: ua.slice(0, 256),
      ip: ip.slice(0, 64),
      ts: new Date().toISOString(),
    };

    // 6. Fire-and-forget write to Upstash (no await)
    //    Using .catch on the promise itself to silently swallow errors
    //    without creating an unhandled rejection.
    void pushToUpstash(entry).catch(() => {});

    // 7. Respond immediately — do not block
    return NextResponse.json({ ok: true });
  } catch {
    // Absolute last resort — never fail the request
    return NextResponse.json({ ok: true });
  }
}

// ─── Block other methods ────────────────────────────────────────
export function GET() {
  return NextResponse.json(
    { status: "analytics-v3", ok: true },
    { status: 200 }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
