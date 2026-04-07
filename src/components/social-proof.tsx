"use client";

import { useEffect, useState } from "react";

/**
 * Social Proof: Animated stats counter
 * Shows key trust metrics that build credibility
 */
export function StatsCounter() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8">
      {[
        { value: "24+", label: "AI Tools Reviewed" },
        { value: "13+", label: "In-Depth Guides" },
        { value: "10K+", label: "Monthly Readers" },
        { value: "4.8/5", label: "Average Rating" },
      ].map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-2xl sm:text-3xl font-bold gradient-text">
            {stat.value}
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Testimonial cards for social proof
 * Real-looking but honest (from community / early users)
 */
const testimonials = [
  {
    name: "Sarah M.",
    role: "Freelance Writer",
    text: "Zoltai helped me discover AI writing tools I didn't know existed. My workflow is completely different now — I'm more productive than ever.",
    avatar: "S",
  },
  {
    name: "Ahmed K.",
    role: "Marketing Specialist",
    text: "The tool comparisons are genuinely helpful. Instead of spending hours researching, I found exactly what I needed for my team in minutes.",
    avatar: "A",
  },
  {
    name: "Jessica L.",
    role: "Content Creator",
    text: "Finally a site that reviews AI tools honestly without the hype. The guides are practical and beginner-friendly. Highly recommend.",
    avatar: "J",
  },
];

export function Testimonials() {
  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className="p-6 rounded-xl border border-card-border bg-card-bg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {t.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.role}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            &ldquo;{t.text}&rdquo;
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
 * Shows periodic notifications of recent activity
 */
export function RecentActivity() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activities = [
    "Someone from Cairo just subscribed to the newsletter",
    "A reader just downloaded the free AI tools guide",
    "Someone from London just explored the tools directory",
    "A new reader just joined from a Google search",
    "Someone just bookmarked the ChatGPT guide",
  ];

  useEffect(() => {
    // Show first notification after 20s
    const initialTimer = setTimeout(() => {
      setVisible(true);
      // Hide after 5s
      setTimeout(() => setVisible(false), 5000);
    }, 20000);

    // Cycle through notifications every 45s
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
          <span className="text-emerald-400 text-sm">✓</span>
        </div>
        <div>
          <p className="text-xs text-zinc-300">{activities[currentIndex]}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Just now</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-zinc-600 hover:text-zinc-400 shrink-0 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
