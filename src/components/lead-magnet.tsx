"use client";

import { useState } from "react";
import { useLang } from "./providers";

export function LeadMagnet() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { t } = useLang();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card-bg to-accent/5 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-bold text-2xl text-emerald-400 mb-2">
          {t("lead.success.title")}
        </h3>
        <p className="text-zinc-400">
          {t("lead.success.desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card-bg to-cyan-500/5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl" />

      <div className="relative text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent-light text-xs font-semibold mb-4">
          {t("lead.badge")}
        </div>
        <h3 className="font-bold text-2xl sm:text-3xl mb-2">
          {t("lead.title1")}{" "}
          <span className="gradient-text">{t("lead.title2")}</span>
        </h3>
        <p className="text-zinc-400 mb-2 max-w-lg mx-auto">
          {t("lead.desc")}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> {t("lead.check1")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> {t("lead.check2")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> {t("lead.check3")}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("lead.namePlaceholder")}
            className="sm:w-36 px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-accent/50"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("lead.emailPlaceholder")}
            required
            className="flex-1 px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap shadow-lg shadow-accent/20"
          >
            {status === "loading" ? "..." : t("lead.cta")}
          </button>
        </form>

        {status === "error" && (
          <p className="text-red-400 text-sm mt-3">
            Something went wrong. Try again.
          </p>
        )}

        <p className="text-xs text-zinc-500 mt-4">
          {t("lead.joinCount")}
        </p>
      </div>
    </div>
  );
}
