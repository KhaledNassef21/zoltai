"use client";

import Link from "next/link";
import { useLang } from "./providers";

/**
 * "How It Works" — 4-step journey inspired by Scholars Academie.
 * Dark theme, numbered cards with connecting gradient line on desktop.
 */
export function HowItWorks() {
  const { t, dir } = useLang();

  const steps = [
    {
      num: "01",
      icon: "🔍",
      title: t("how.s1.title"),
      desc: t("how.s1.desc"),
      accent: "from-purple-500 to-pink-500",
    },
    {
      num: "02",
      icon: "⚖️",
      title: t("how.s2.title"),
      desc: t("how.s2.desc"),
      accent: "from-cyan-500 to-blue-500",
    },
    {
      num: "03",
      icon: "🎯",
      title: t("how.s3.title"),
      desc: t("how.s3.desc"),
      accent: "from-emerald-500 to-teal-500",
    },
    {
      num: "04",
      icon: "🚀",
      title: t("how.s4.title"),
      desc: t("how.s4.desc"),
      accent: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold tracking-widest text-accent-light uppercase mb-3">
          {t("how.badge")}
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          {t("how.title").split(" ").slice(0, -1).join(" ")}{" "}
          <span className="gradient-text">
            {t("how.title").split(" ").slice(-1).join(" ")}
          </span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">{t("how.desc")}</p>
      </div>

      <div className="relative">
        {/* Connecting line on desktop (horizontal) */}
        <div className="hidden lg:block absolute top-14 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="group relative p-6 rounded-2xl border border-card-border bg-card-bg/50 hover:bg-card-bg hover:border-accent/30 transition-all"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Glow effect on hover */}
              <div
                className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-20 blur-xl transition-opacity -z-10`}
              />

              {/* Step number badge */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-xl shadow-lg`}
                >
                  {step.icon}
                </div>
                <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">
                  {step.num}
                </span>
              </div>

              <h3 className="font-bold text-lg text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {step.desc}
              </p>

              {/* Arrow for next step (mobile: down, desktop: right) */}
              {i < steps.length - 1 && (
                <div
                  className={`hidden lg:flex absolute top-14 ${
                    dir === "rtl" ? "-left-3" : "-right-3"
                  } w-6 h-6 rounded-full bg-card-bg border border-card-border items-center justify-center text-zinc-500`}
                >
                  <svg
                    className={`w-3 h-3 ${dir === "rtl" ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors"
        >
          {t("how.cta")}
          <svg
            className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
