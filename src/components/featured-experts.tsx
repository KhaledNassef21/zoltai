"use client";

import Link from "next/link";
import { useLang } from "./providers";

/**
 * "Featured AI Experts" — mentor-style cards inspired by Scholars Academie.
 * Shows curated AI tool power users / experts with profession, expertise, and tool focus.
 */
export function FeaturedExperts() {
  const { t, dir } = useLang();

  const experts = [
    {
      initials: "AM",
      gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
      name: t("expert.1.name"),
      role: t("expert.1.role"),
      expertise: t("expert.1.expertise"),
      specialty: "Writing & Content",
      icon: "✍️",
      stats: [
        { label: t("expert.yearsExp"), value: "5+" },
        { label: t("expert.tools"), value: "12" },
      ],
    },
    {
      initials: "RK",
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      name: t("expert.2.name"),
      role: t("expert.2.role"),
      expertise: t("expert.2.expertise"),
      specialty: "Design & Visual",
      icon: "🎨",
      stats: [
        { label: t("expert.yearsExp"), value: "7+" },
        { label: t("expert.tools"), value: "15" },
      ],
    },
    {
      initials: "LS",
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      name: t("expert.3.name"),
      role: t("expert.3.role"),
      expertise: t("expert.3.expertise"),
      specialty: "Code & Automation",
      icon: "💻",
      stats: [
        { label: t("expert.yearsExp"), value: "8+" },
        { label: t("expert.tools"), value: "20" },
      ],
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold tracking-widest text-accent-light uppercase mb-3">
          {t("experts.badge")}
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          {t("experts.title").split(" ").slice(0, -2).join(" ")}{" "}
          <span className="gradient-text">
            {t("experts.title").split(" ").slice(-2).join(" ")}
          </span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">{t("experts.desc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {experts.map((expert, i) => (
          <div
            key={i}
            className="group relative p-6 rounded-2xl border border-card-border bg-card-bg/50 hover:bg-card-bg hover:border-accent/30 transition-all overflow-hidden"
          >
            {/* Decorative gradient blob */}
            <div
              className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${expert.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`}
            />

            <div className="relative">
              {/* Avatar + tool badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${expert.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                  >
                    {expert.initials}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-card-bg border-2 border-card-border flex items-center justify-center text-sm">
                    {expert.icon}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent-light font-semibold">
                  {expert.specialty}
                </span>
              </div>

              {/* Name + role */}
              <h3 className="font-bold text-lg text-zinc-100">{expert.name}</h3>
              <p className="text-sm text-zinc-400 mb-3">{expert.role}</p>

              {/* Expertise */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-5 min-h-[4rem]">
                {expert.expertise}
              </p>

              {/* Stats */}
              <div className="flex gap-4 pt-4 border-t border-card-border">
                {expert.stats.map((s, j) => (
                  <div key={j} className="flex-1">
                    <p className="text-lg font-bold gradient-text">{s.value}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-card-border hover:border-accent/40 text-zinc-300 hover:bg-card-bg font-medium transition-all"
        >
          {t("experts.cta")}
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
