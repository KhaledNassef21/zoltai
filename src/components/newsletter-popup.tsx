"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { trackFunnel } from "@/lib/tracking";

/**
 * Newsletter Popup — shows after 45 seconds OR on exit intent.
 * Only shows once per session. Dismissed = don't show again for 7 days.
 */
export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem("popup_dismissed", Date.now().toString());
    trackFunnel({ event: "popup_dismissed", source: "newsletter_popup" });
  }, []);

  useEffect(() => {
    // Check if already dismissed (within 7 days)
    const dismissed = localStorage.getItem("popup_dismissed");
    if (dismissed) {
      const daysSince =
        (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    // Check if already subscribed
    if (localStorage.getItem("newsletter_subscribed")) return;

    // Show after 45 seconds
    const timer = setTimeout(() => {
      setShow(true);
      trackFunnel({ event: "popup_shown", source: "newsletter_popup_timer" });
    }, 45000);

    // Exit intent detection (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        trackFunnel({
          event: "popup_shown",
          source: "newsletter_popup_exit",
        });
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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
        localStorage.setItem("newsletter_subscribed", "true");
        trackFunnel({
          event: "newsletter_signup",
          source: "popup",
          meta: email,
        });
        // Auto-dismiss after 3s
        setTimeout(() => setShow(false), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md bg-card-bg border border-card-border rounded-2xl p-8 shadow-2xl shadow-accent/10 animate-in">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-zinc-500 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-3">🎉</p>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">
              You're In!
            </h3>
            <p className="text-zinc-400 text-sm">
              Check your inbox for your free AI Money Guide.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent-light text-xs font-bold mb-3">
                FREE GUIDE
              </div>
              <h3 className="text-2xl font-bold mb-2">
                10 AI Tools Making People{" "}
                <span className="gradient-text">$1,000/Month</span>
              </h3>
              <p className="text-zinc-400 text-sm">
                Get the exact tools + strategies. Free. No coding needed.
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-4 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Top 10 earning
                tools ranked
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Step-by-step
                income playbooks
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Weekly AI money
                tips
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold transition-all hover:scale-[1.01] disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                {status === "loading"
                  ? "Joining..."
                  : "🔥 Get Free Guide + Weekly Tips"}
              </button>
            </form>

            {status === "error" && (
              <p className="text-red-400 text-xs mt-2 text-center">
                Something went wrong. Try again.
              </p>
            )}

            <p className="text-xs text-zinc-600 text-center mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .animate-in {
          animation: popIn 0.3s ease-out;
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
