"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLang } from "./providers";

// ============================================================
// Animated Stats Counter — counts up from 0 to target on mount
// ============================================================

function useCountUp(end: number, duration: number = 1800, startOnView: boolean = true) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      runAnimation();
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            runAnimation();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();

    function runAnimation() {
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * end));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [end, duration, startOnView]);

  return { value, ref };
}

function StatItem({
  target,
  suffix,
  label,
  icon,
}: {
  target: number;
  suffix: string;
  label: string;
  icon: string;
}) {
  const { value, ref } = useCountUp(target);
  const display =
    target >= 1000 && value >= 1000
      ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`
      : value.toString();

  return (
    <div className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-card-border bg-card-bg/50 hover:bg-card-bg hover:border-accent/30 transition-all">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-cyan-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="text-2xl mb-2 opacity-80">{icon}</div>
        <p className="text-3xl sm:text-4xl font-bold">
          <span ref={ref} className="gradient-text">
            {display}
          </span>
          <span className="gradient-text">{suffix}</span>
        </p>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">{label}</p>
      </div>
    </div>
  );
}

export function StatsCounter() {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatItem target={24} suffix="+" label={t("stats.tools")} icon="🛠️" />
      <StatItem target={19} suffix="+" label={t("stats.guides")} icon="📚" />
      <StatItem target={10000} suffix="+" label={t("stats.readers")} icon="👥" />
      <StatItem target={48} suffix="/50" label={t("stats.rating")} icon="⭐" />
    </div>
  );
}

// ============================================================
// Testimonials Carousel — circular avatar + specialty badge
// inspired by Scholars Academie but dark-themed
// ============================================================

const AVATAR_GRADIENTS = [
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-purple-500",
  "from-indigo-500 to-cyan-500",
];

export function Testimonials() {
  const { t, dir } = useLang();

  // Photos: pravatar.cc (deterministic placeholder avatars — will be replaced
  // with real customer photos once testimonials are collected)
  const testimonials = [
    {
      name: t("testimonial.1.name"),
      role: t("testimonial.1.role"),
      text: t("testimonial.1.text"),
      tool: "ChatGPT",
      toolIcon: "💬",
      photo: "https://i.pravatar.cc/160?img=47",
      initials: "S",
    },
    {
      name: t("testimonial.2.name"),
      role: t("testimonial.2.role"),
      text: t("testimonial.2.text"),
      tool: "Jasper",
      toolIcon: "✍️",
      photo: "https://i.pravatar.cc/160?img=12",
      initials: "A",
    },
    {
      name: t("testimonial.3.name"),
      role: t("testimonial.3.role"),
      text: t("testimonial.3.text"),
      tool: "Midjourney",
      toolIcon: "🎨",
      photo: "https://i.pravatar.cc/160?img=44",
      initials: "J",
    },
    {
      name: t("testimonial.4.name"),
      role: t("testimonial.4.role"),
      text: t("testimonial.4.text"),
      tool: "Claude",
      toolIcon: "🧠",
      photo: "https://i.pravatar.cc/160?img=33",
      initials: "M",
    },
    {
      name: t("testimonial.5.name"),
      role: t("testimonial.5.role"),
      text: t("testimonial.5.text"),
      tool: "Cursor",
      toolIcon: "💻",
      photo: "https://i.pravatar.cc/160?img=68",
      initials: "O",
    },
  ];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const DURATION = 6000; // 6s per slide

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const tick = setTimeout(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, DURATION);
    return () => clearTimeout(tick);
  }, [active, paused, testimonials.length]);

  // Progress bar reset on slide change
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "scaleX(0)";
    // Force reflow
    void el.offsetWidth;
    if (!paused) {
      el.style.transition = `transform ${DURATION}ms linear`;
      el.style.transform = "scaleX(1)";
    }
  }, [active, paused]);

  const current = testimonials[active];
  const gradient = AVATAR_GRADIENTS[active % AVATAR_GRADIENTS.length];

  return (
    <div
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main card */}
      <div className="relative p-8 sm:p-10 rounded-3xl border border-card-border bg-gradient-to-br from-card-bg to-card-bg/50 overflow-hidden">
        {/* Decorative quote mark */}
        <div
          className={`absolute top-6 text-8xl font-serif text-accent/10 leading-none select-none pointer-events-none ${
            dir === "rtl" ? "right-6" : "left-6"
          }`}
        >
          &ldquo;
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar with ring */}
          <div className="relative mb-5">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} blur-md opacity-60`}
            />
            <div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-card-bg bg-gradient-to-br ${gradient}`}
            >
              <Image
                src={current.photo}
                alt={current.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            {/* Tool badge (bottom-right of avatar) */}
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-card-bg border-2 border-card-border flex items-center justify-center text-base shadow-lg">
              {current.toolIcon}
            </div>
          </div>

          {/* Quote */}
          <p className="text-base sm:text-lg text-zinc-200 leading-relaxed max-w-2xl mb-6 min-h-[6rem]">
            &ldquo;{current.text}&rdquo;
          </p>

          {/* 5-star */}
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          {/* Name + role + tool tag */}
          <div>
            <p className="font-semibold text-zinc-100">{current.name}</p>
            <p className="text-sm text-zinc-400 mt-0.5">{current.role}</p>
            <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 font-medium">
              {current.toolIcon} {current.tool} {t("testimonial.user")}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-card-border/40">
          <div
            ref={progressRef}
            className="h-full bg-gradient-to-r from-accent to-cyan-500 origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`transition-all rounded-full ${
              i === active
                ? "w-8 h-2 bg-accent"
                : "w-2 h-2 bg-zinc-600 hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Recently joined toast — unchanged (FOMO element)
// ============================================================

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
  }, [activities.length]);

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
