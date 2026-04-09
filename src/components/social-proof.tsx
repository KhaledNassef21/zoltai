"use client";

import { useEffect, useState } from "react";
import { useLang } from "./providers";

/**
 * Social Proof: Animated stats counter
 * Shows key trust metrics that build credibility
 */
export function StatsCounter() {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8">
      {[
        { value: "24+", label: t("stats.tools") },
        { value: "13+", label: t("stats.guides") },
        { value: "10K+", label: t("stats.readers") },
        { value: "4.8/5", label: t("stats.rating") },
      ].map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-2xl sm:text-3xl font-bold gradient-text">
            {stat.value}
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Testimonial cards for social proof
 */
export function Testimonials() {
  const { t } = useLang();

  const testimonials = [
    {
      name: t("testimonial.1.name"),
      role: t("testimonial.1.role"),
      text: t("testimonial.1.text"),
      avatar: "S",
    },
    {
      name: t("testimonial.2.name"),
      role: t("testimonial.2.role"),
      text: t("testimonial.2.text"),
      avatar: "A",
    },
    {
      name: t("testimonial.3.name"),
      role: t("testimonial.3.role"),
      text: t("testimonial.3.text"),
      avatar: "J",
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {testimonials.map((item, i) => (
        <div
          key={i}
          className="p-6 rounded-xl border border-card-border bg-card-bg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {item.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{item.name}</p>
              <p className="text-xs text-zinc-400">{item.role}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            &ldquo;{item.text}&rdquo;
          </p>
          <div className="flex gap-0.5 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className="w-3.5 h-3.5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * "Recently joined" notification - FOMO element
 */
export function RecentActivity() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activities = [
    t("activity.1"),
    t("activity.2"),
    t("activity.3"),
    t("activity.4"),
    t("activity.5"),
  ];

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 20000);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 animate-in slide-in-from-left duration-500">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-card-border bg-card-bg/95 backdrop-blur-md shadow-xl max-w-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <span className="text-emerald-400 text-sm">{"\u2713"}</span>
        </div>
        <div>
          <p className="text-xs text-zinc-300">{activities[currentIndex]}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{t("activity.justNow")}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-zinc-500 hover:text-zinc-400 shrink-0 ml-2"
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
