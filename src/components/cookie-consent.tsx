"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const MEASUREMENT_ID = "G-SVLHSVYCWV";
const CONSENT_KEY = "zoltai-analytics-consent-v2";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    const timer = setTimeout(() => {
      setAccepted(consent === "accepted");
      setVisible(!consent);
    }, consent ? 0 : 1500);
    const openSettings = () => setVisible(true);
    window.addEventListener("zoltai-cookie-settings", openSettings);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("zoltai-cookie-settings", openSettings);
    };
  }, []);

  useEffect(() => {
    // No Google script, cookies or pings before explicit analytics consent.
    // Never send signed-in or admin pages to Google.
    if (!accepted || !pathname || /^\/(admin|api|auth|login|register|account|dashboard)(\/|$)/.test(pathname)) return;
    const w = window as AnalyticsWindow;
    if (!w.gtag) {
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () {
        // gtag's queue consumes the standard Arguments command format.
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      w.gtag("js", new Date());
      w.gtag("config", MEASUREMENT_ID, {
        send_page_view: false,
        page_location: window.location.origin + pathname,
        page_referrer: document.referrer ? new URL(document.referrer).origin : "",
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 60 * 60 * 24 * 30,
      });
      const script = document.createElement("script");
      script.id = "zoltai-ga4";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).origin : ""; } catch {}
    w.gtag("event", "page_view", {
      page_location: window.location.origin + pathname,
      page_title: document.title,
      page_referrer: referrer,
    });
  }, [accepted, pathname]);

  const choose = (allow: boolean) => {
    localStorage.setItem(CONSENT_KEY, allow ? "accepted" : "declined");
    setVisible(false);
    if (!allow) {
      const w = window as AnalyticsWindow;
      w.gtag?.("consent", "update", { analytics_storage: "denied" });
      // Remove this site's GA cookies and reload to unload the Google script.
      for (const item of document.cookie.split(";")) {
        const name = item.trim().split("=")[0];
        if (!/^_ga($|_)/.test(name)) continue;
        for (const domain of ["", window.location.hostname, ".zoltai.org"]) {
          document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
        }
      }
      setAccepted(false);
      if (w.gtag) window.location.reload();
    } else {
      setAccepted(true);
    }
  };

  if (!visible || pathname?.startsWith("/admin")) return null;

  return (
    <div role="region" aria-label="Analytics cookie choices" className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto rounded-xl border border-card-border bg-card-bg/95 backdrop-blur-md shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="flex-1 text-sm text-zinc-300 leading-relaxed">
            With your permission, we use Google Analytics cookies to measure visits,
            traffic sources and approximate countries. Analytics stays off unless
            you accept. You can change your choice in Cookie settings in the footer.{" "}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Privacy Policy</Link>
          </p>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => choose(false)} className="px-4 py-2 text-sm text-zinc-300 border border-card-border rounded-lg hover:border-zinc-600">Decline</button>
            <button onClick={() => choose(true)} className="px-4 py-2 text-sm text-zinc-300 border border-card-border rounded-lg hover:border-zinc-600">Accept analytics</button>
          </div>
        </div>
      </div>
    </div>
  );
}
