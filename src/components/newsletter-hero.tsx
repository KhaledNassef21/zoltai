"use client";

import { useState } from "react";
import { useLang } from "./providers";

/**
 * Newsletter Hero section — Scholars-inspired full-width CTA.
 * Slots in before the footer for maximum conversion.
 */
export function NewsletterHero() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-card-border bg-gradient-to-br from-accent/15 via-card-bg to-cyan-500/10 p-8 sm:p-12">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative grid md:grid-cols-2 gap-8 items-center">
        {/* Left: text */}
        <div>
          <span className="inline-block text-xs font-bold tracking-widest text-accent-light uppercase mb-3">
            {t("newsletterHero.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            {t("newsletterHero.title1")}{" "}
            <span className="gradient-text">{t("newsletterHero.title2")}</span>
          </h2>
          <p className="text-zinc-400 mb-5 leading-relaxed">
            {t("newsletterHero.desc")}
          </p>

          {/* Benefits list */}
          <ul className="space-y-2">
            {[
              t("newsletterHero.benefit1"),
              t("newsletterHero.benefit2"),
              t("newsletterHero.benefit3"),
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs mt-0.5">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form card */}
        <div className="relative">
          {status === "success" ? (
            <div className="p-8 rounded-2xl border border-emerald-500/30 bg-card-bg/80 backdrop-blur text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-bold text-xl text-emerald-400 mb-2">
                {t("newsletterHero.successTitle")}
              </h3>
              <p className="text-sm text-zinc-400">
                {t("newsletterHero.successDesc")}
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="p-6 rounded-2xl border border-card-border bg-card-bg/80 backdrop-blur"
            >
              <label
                htmlFor="newsletter-hero-email"
                className="block text-sm font-semibold text-zinc-200 mb-2"
              >
                {t("newsletterHero.formLabel")}
              </label>
              <input
                id="newsletter-hero-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletterHero.placeholder")}
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 mb-3"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold transition-all hover:scale-[1.01] disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                {status === "loading"
                  ? "..."
                  : `${t("newsletterHero.cta")} \u2192`}
              </button>
              {status === "error" && (
                <p className="text-red-400 text-xs mt-2 text-center">
                  {t("newsletterHero.error")}
                </p>
              )}
              <p className="text-[11px] text-zinc-500 mt-3 text-center">
                {t("newsletterHero.privacy")}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
