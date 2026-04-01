"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const dismissed = localStorage.getItem("push-dismissed");
    if (dismissed) return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    if (Notification.permission === "granted") {
      setSubscribed(true);
      return;
    }

    const timer = setTimeout(() => {
      if (Notification.permission !== "denied") {
        setShow(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [pathname]);

  async function handleSubscribe() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSubscribed(true);
        setShow(false);

        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Welcome to Zoltai!", {
            body: "You'll get notified about new AI money-making tips.",
            icon: "/icons/icon-192.png",
          });
        }
      } else {
        setShow(false);
        localStorage.setItem("push-dismissed", "true");
      }
    } catch {
      setShow(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("push-dismissed", "true");
  }

  if (!show || subscribed) return null;

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm">
      <div className="p-4 rounded-xl bg-card-bg border border-card-border shadow-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">&#x1F514;</span>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Get AI Money Tips</p>
            <p className="text-xs text-zinc-400 mb-3">
              Get notified when we publish new guides about making money with AI
              tools.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-medium transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
