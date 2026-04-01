import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ANALYTICS_FILE = path.join(process.cwd(), "data/analytics.json");

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

    let events: AnalyticsEvent[] = [];
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        events = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf-8"));
      }
    } catch {}

    events.push(entry);

    // Keep last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }

    const dir = path.dirname(ANALYTICS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(events, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
