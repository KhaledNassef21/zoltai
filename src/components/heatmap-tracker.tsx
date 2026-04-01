"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight click heatmap tracker.
 * Records click positions and sends them to /api/analytics/track.
 * Data can be visualized in admin dashboard.
 */
export function HeatmapTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track on admin pages
    if (pathname?.startsWith("/admin")) return;

    let clickBuffer: { x: number; y: number; el: string; time: number }[] = [];

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = (target.className || "").toString().slice(0, 50);
      const text = (target.textContent || "").slice(0, 30);

      clickBuffer.push({
        x: Math.round((e.clientX / window.innerWidth) * 100),
        y: Math.round((e.clientY / window.innerHeight) * 100),
        el: `${tagName}${className ? "." + className.split(" ")[0] : ""}${text ? `[${text}]` : ""}`,
        time: Date.now(),
      });

      // Flush every 10 clicks
      if (clickBuffer.length >= 10) {
        flushClicks();
      }
    }

    function flushClicks() {
      if (clickBuffer.length === 0) return;

      const data = [...clickBuffer];
      clickBuffer = [];

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "heatmap_clicks",
          variant: JSON.stringify(data),
          page: pathname,
        }),
      }).catch(() => {});
    }

    // Track scroll depth
    let maxScroll = 0;
    function handleScroll() {
      const scrollPercent = Math.round(
        ((window.scrollY + window.innerHeight) /
          document.documentElement.scrollHeight) *
          100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }
    }

    // Track page view
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "page_view",
        variant: "",
        page: pathname,
      }),
    }).catch(() => {});

    document.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Flush on page leave
    function handleBeforeUnload() {
      flushClicks();

      // Send scroll depth
      if (maxScroll > 0) {
        navigator.sendBeacon(
          "/api/analytics/track",
          JSON.stringify({
            event: "scroll_depth",
            variant: String(maxScroll),
            page: pathname,
          })
        );
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushClicks();
    };
  }, [pathname]);

  return null;
}
