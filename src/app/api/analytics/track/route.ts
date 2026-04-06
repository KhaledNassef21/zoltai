import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const ANALYTICS_FILE = path.join(process.cwd(), "data/analytics.json");
const GITHUB_ANALYTICS_PATH = "data/analytics.json";

interface AnalyticsEvent {
  event: string;
  variant: string;
  page: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const { event, variant, page } = await req.json();

    if (!event) {
      return NextResponse.json({ error: "Event required" }, { status: 400 });
    }

    const entry: AnalyticsEvent = {
      event,
      variant: variant || "",
      page: page || "",
      timestamp: new Date().toISOString(),
    };

    // Load existing events
    let events: AnalyticsEvent[] = [];
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        events = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf-8"));
      }
    } catch {}

    // If local failed, try GitHub
    if (events.length === 0 && isGitHubAvailable()) {
      try {
        const file = await readFile(GITHUB_ANALYTICS_PATH);
        if (file) events = JSON.parse(file.content);
      } catch {}
    }

    events.push(entry);

    // Keep last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }

    const json = JSON.stringify(events, null, 2);

    // Try local save
    try {
      const dir = path.dirname(ANALYTICS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ANALYTICS_FILE, json);
      return NextResponse.json({ success: true });
    } catch {
      // Filesystem failed
    }

    // Try GitHub (but don't block on analytics - fire and forget)
    if (isGitHubAvailable()) {
      // Don't await — analytics shouldn't block the response
      writeFile(GITHUB_ANALYTICS_PATH, json, "Track analytics event").catch(
        () => {}
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    // Analytics should never fail the user experience
    return NextResponse.json({ success: true });
  }
}
