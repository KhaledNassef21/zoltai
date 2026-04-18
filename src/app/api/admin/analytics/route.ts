/**
 * Admin analytics viewer — reads from Upstash Redis.
 *
 * GET  /api/admin/analytics         → last 200 events + summary
 * GET  /api/admin/analytics?n=1000  → last 1000 events
 * DELETE /api/admin/analytics       → clear all events
 *
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyticsEvent {
  event: string;
  variant: string;
  page: string;
  ua: string;
  ip: string;
  ts: string;
}

async function upstashCmd(
  cmd: (string | number)[]
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Upstash not configured");

  const res = await fetch(`${url}/${cmd.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upstash ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.result;
}

function parseEvents(raw: unknown): AnalyticsEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: AnalyticsEvent[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    try {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === "object" && typeof parsed.event === "string") {
        out.push({
          event: String(parsed.event || ""),
          variant: String(parsed.variant || ""),
          page: String(parsed.page || ""),
          ua: String(parsed.ua || ""),
          ip: String(parsed.ip || ""),
          ts: String(parsed.ts || ""),
        });
      }
    } catch {
      // skip malformed entries
    }
  }
  return out;
}

function buildSummary(events: AnalyticsEvent[]) {
  const byEvent: Record<string, number> = {};
  const byPage: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
    if (e.page) byPage[e.page] = (byPage[e.page] || 0) + 1;
    const day = e.ts.slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
  }

  const topN = <T extends Record<string, number>>(obj: T, n: number) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count]) => ({ key, count }));

  return {
    total: events.length,
    byEvent: topN(byEvent, 20),
    byPage: topN(byPage, 20),
    byDay: Object.entries(byDay)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30)
      .map(([day, count]) => ({ day, count })),
  };
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasUpstash) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Upstash not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        events: [],
        summary: { total: 0, byEvent: [], byPage: [], byDay: [] },
      },
      { status: 200 }
    );
  }

  const n = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("n") || "200", 10) || 200, 1),
    10000
  );

  try {
    const raw = await upstashCmd(["lrange", "analytics:events", "0", n - 1]);
    const events = parseEvents(raw);
    return NextResponse.json({
      configured: true,
      count: events.length,
      events,
      summary: buildSummary(events),
    });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasUpstash) {
    return NextResponse.json({ error: "Upstash not configured" }, { status: 400 });
  }

  try {
    await upstashCmd(["del", "analytics:events"]);
    return NextResponse.json({ ok: true, cleared: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
