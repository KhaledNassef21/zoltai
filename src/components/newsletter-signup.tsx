"use client";

import { useState } from "react";

interface NewsletterSignupProps {
  variant?: "inline" | "card" | "banner";
  title?: string;
  description?: string;
}

export function NewsletterSignup({
  variant = "card",
  title = "Get Weekly AI Insights",
  description = "The best AI tools, productivity hacks, and guides — delivered to your inbox every week. Free.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You're in! Check your inbox.");
        setEmail("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-2.5 rounded-lg bg-card-bg border border-card-border text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
        {status === "success" && (
          <span className="text-emerald-400 text-xs self-center">{message}</span>
        )}
      </form>
    );
  }

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-accent/15 via-card-bg to-cyan-500/15 border border-accent/20 rounded-xl p-6 my-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-white">{title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 md:w-56 px-4 py-2.5 rounded-lg bg-background border border-card-border text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        </div>
        {status !== "idle" && (
          <p
            className={`text-xs mt-3 ${
              status === "success" ? "text-emerald-400" : status === "error" ? "text-red-400" : "text-zinc-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="p-8 rounded-xl border border-card-border bg-card-bg text-center">
      <div className="text-3xl mb-3">
        <span role="img" aria-label="mail">
          &#9993;
        </span>
      </div>
      <h3 className="font-bold text-xl text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-3 rounded-lg bg-background border border-card-border text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe Free"}
        </button>
      </form>
      {status !== "idle" && (
        <p
          className={`text-sm mt-4 ${
            status === "success" ? "text-emerald-400" : status === "error" ? "text-red-400" : "text-zinc-500"
          }`}
        >
          {message}
        </p>
      )}
      <p className="text-xs text-zinc-700 mt-4">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
