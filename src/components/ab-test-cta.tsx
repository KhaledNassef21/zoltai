"use client";

import { useState, useEffect } from "react";

interface CTAVariant {
  id: string;
  text: string;
  color: string;
  href: string;
}

const CTA_VARIANTS: CTAVariant[] = [
  {
    id: "a",
    text: "Start Earning with AI \u2192",
    color: "bg-gradient-to-r from-purple-600 to-cyan-600",
    href: "/earn",
  },
  {
    id: "b",
    text: "Make Money with AI Tools \u2192",
    color: "bg-gradient-to-r from-purple-600 to-pink-600",
    href: "/earn",
  },
  {
    id: "c",
    text: "Discover AI Side Hustles \u2192",
    color: "bg-gradient-to-r from-cyan-600 to-emerald-600",
    href: "/earn",
  },
];

export function ABTestCTA({ className = "" }: { className?: string }) {
  const [variant, setVariant] = useState<CTAVariant | null>(null);

  useEffect(() => {
    let storedVariant = localStorage.getItem("ab-cta-variant");

    if (!storedVariant || !CTA_VARIANTS.find((v) => v.id === storedVariant)) {
      const idx = Math.floor(Math.random() * CTA_VARIANTS.length);
      storedVariant = CTA_VARIANTS[idx].id;
      localStorage.setItem("ab-cta-variant", storedVariant);
      trackEvent("cta_impression", storedVariant);
    }

    setVariant(
      CTA_VARIANTS.find((v) => v.id === storedVariant) || CTA_VARIANTS[0]
    );
  }, []);

  function handleClick() {
    if (variant) {
      trackEvent("cta_click", variant.id);
    }
  }

  if (!variant) return null;

  return (
    <a
      href={variant.href}
      onClick={handleClick}
      className={`inline-block px-6 py-3 rounded-lg ${variant.color} text-white font-semibold text-sm hover:opacity-90 transition-opacity ${className}`}
    >
      {variant.text}
    </a>
  );
}

function trackEvent(event: string, variantId: string) {
  try {
    const key = "ab-events";
    const events = JSON.parse(localStorage.getItem(key) || "[]");
    events.push({
      event,
      variant: variantId,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    });
    if (events.length > 1000) events.splice(0, events.length - 1000);
    localStorage.setItem(key, JSON.stringify(events));
  } catch {}

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      variant: variantId,
      page: window.location.pathname,
    }),
  }).catch(() => {});
}
