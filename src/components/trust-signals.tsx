"use client";

import { useLang } from "./providers";

/**
 * TrustSignals — reassurance band placed near CTAs & purchase points.
 * Conveys: risk-free trial, privacy, endorsement, active community.
 *
 * Variants:
 *  - "bar"     thin inline row (use above/below an affiliate button)
 *  - "grid"    4-up feature grid (use on landing + blog footer)
 *  - "badges"  compact row of logo-style badges (SSL, nofollow, etc.)
 */
interface TrustSignalsProps {
  variant?: "bar" | "grid" | "badges";
}

export function TrustSignals({ variant = "grid" }: TrustSignalsProps) {
  const { t } = useLang();

  const signals = [
    {
      icon: "🔒",
      title: t("trust.secure.title"),
      desc: t("trust.secure.desc"),
    },
    {
      icon: "💯",
      title: t("trust.guarantee.title"),
      desc: t("trust.guarantee.desc"),
    },
    {
      icon: "⚡",
      title: t("trust.instant.title"),
      desc: t("trust.instant.desc"),
    },
    {
      icon: "🤝",
      title: t("trust.trusted.title"),
      desc: t("trust.trusted.desc"),
    },
  ];

  if (variant === "bar") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-xs text-zinc-400">
        {signals.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span>{s.icon}</span>
            <span className="font-medium">{s.title}</span>
          </span>
        ))}
      </div>
    );
  }

  if (variant === "badges") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium">
          <span>🔒</span> {t("trust.badge.ssl")}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent-light text-xs font-medium">
          <span>✓</span> {t("trust.badge.verified")}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium">
          <span>💯</span> {t("trust.badge.moneyback")}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium">
          <span>⭐</span> {t("trust.badge.rated")}
        </span>
      </div>
    );
  }

  return (
    <div className="my-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {signals.map((s, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-card-border bg-card-bg/50 hover:bg-card-bg transition-colors text-center"
        >
          <div className="text-2xl mb-2">{s.icon}</div>
          <p className="font-semibold text-sm text-zinc-100">{s.title}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
