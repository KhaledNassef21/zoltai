/**
 * Funnel Tracking System
 *
 * Tracks the full user journey:
 * 1. Page view (article, tools, earn)
 * 2. CTA click (top, mid, bottom, popup, sticky)
 * 3. Tool visit (which tool, from where)
 * 4. Newsletter signup (which form)
 * 5. Affiliate click (which tool, commission potential)
 *
 * All events sent to /api/analytics/track + stored in localStorage
 */

export type FunnelEvent =
  | "page_view"
  | "cta_click"
  | "cta_impression"
  | "tool_click"
  | "affiliate_click"
  | "newsletter_signup"
  | "popup_shown"
  | "popup_dismissed"
  | "scroll_depth"
  | "email_cta_click";

export interface TrackingData {
  event: FunnelEvent;
  source?: string; // where: "article_top", "article_mid", "popup", "sticky", "earn_page"
  tool?: string; // tool slug if relevant
  article?: string; // article slug
  variant?: string; // A/B test variant
  meta?: string; // any extra info
}

export function trackFunnel(data: TrackingData): void {
  if (typeof window === "undefined") return;

  const entry = {
    ...data,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || "direct",
    utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
    utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
    utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
  };

  // Store in localStorage for local analytics
  try {
    const key = "zoltai_funnel";
    const events = JSON.parse(localStorage.getItem(key) || "[]");
    events.push(entry);
    if (events.length > 5000) events.splice(0, events.length - 5000);
    localStorage.setItem(key, JSON.stringify(events));
  } catch {}

  // Send to server
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: data.event,
      variant: data.source || data.variant || "",
      page: window.location.pathname,
      meta: JSON.stringify({
        tool: data.tool,
        article: data.article,
        referrer: document.referrer,
        utm_source: entry.utm_source,
        utm_campaign: entry.utm_campaign,
      }),
    }),
  }).catch(() => {});
}

/**
 * Build a tracked affiliate URL with UTM parameters
 */
export function buildAffiliateUrl(
  baseUrl: string,
  tool: string,
  source: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "zoltai");
  url.searchParams.set("utm_medium", source);
  url.searchParams.set("utm_campaign", tool);
  return url.toString();
}

/**
 * Get funnel stats from localStorage
 */
export function getFunnelStats(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const events = JSON.parse(localStorage.getItem("zoltai_funnel") || "[]");
    const stats: Record<string, number> = {};
    for (const e of events) {
      stats[e.event] = (stats[e.event] || 0) + 1;
    }
    return stats;
  } catch {
    return {};
  }
}
