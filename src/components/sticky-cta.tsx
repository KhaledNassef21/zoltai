"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Don't show on admin pages or the earn page itself
  const isHidden = pathname?.startsWith("/admin") || pathname === "/earn";

  useEffect(() => {
    if (isHidden || dismissed) return;

    const handleScroll = () => {
      // Show after scrolling 300px
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHidden, dismissed]);

  if (isHidden || dismissed || !visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-bounce-slow">
      <div className="relative group">
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ×
        </button>

        {/* CTA Button */}
        <Link
          href="/earn"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
        >
          <span className="text-lg">🔥</span>
          <span>Make Money with AI Tools</span>
        </Link>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
