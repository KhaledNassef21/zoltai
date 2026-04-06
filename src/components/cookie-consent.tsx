"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show after 1.5s so it doesn't block initial page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto rounded-xl border border-card-border bg-card-bg/95 backdrop-blur-md shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-300 leading-relaxed">
              We use cookies to improve your experience, analyze site traffic, and
              understand how you interact with our content. By clicking
              &quot;Accept&quot;, you consent to our use of cookies.{" "}
              <Link
                href="/privacy"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-card-border rounded-lg hover:border-zinc-600 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:opacity-90 transition-opacity"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
