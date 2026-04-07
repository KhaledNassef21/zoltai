"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Testimonials, StatsCounter } from "@/components/social-proof";

interface UserData {
  id: string;
  name: string;
  email: string;
  premium: boolean;
}

const premiumFeatures = [
  {
    icon: "🎯",
    title: "Advanced AI Strategies",
    description:
      "Step-by-step blueprints for building AI-powered workflows",
  },
  {
    icon: "📊",
    title: "Exclusive Tool Comparisons",
    description:
      "In-depth reviews with real-world performance data and benchmarks",
  },
  {
    icon: "🔧",
    title: "Done-for-You Templates",
    description: "Prompts, workflows, and automation templates ready to use",
  },
  {
    icon: "💬",
    title: "Priority Support",
    description: "Get your questions answered directly by AI experts",
  },
  {
    icon: "📈",
    title: "Monthly Performance Reports",
    description:
      "See what tools and strategies are trending with real data",
  },
  {
    icon: "🚀",
    title: "Early Access",
    description: "Be the first to know about new tools and opportunities",
  },
];

const premiumArticles = [
  {
    title: "How to Build an AI Content Agency (Full Blueprint)",
    locked: true,
  },
  {
    title: "The Complete ChatGPT Freelancing Playbook: Getting Started",
    locked: true,
  },
  {
    title: "AI Automation Playbook: 7 Workflows That Save Hours",
    locked: true,
  },
  {
    title: "Advanced Midjourney for Print-on-Demand: Complete Strategy",
    locked: true,
  },
  {
    title: "Building SaaS Tools with AI: Zero-Code to Launch",
    locked: true,
  },
];

const freeVsPremium = [
  { feature: "AI Tool Reviews", free: true, premium: true },
  { feature: "Blog Articles", free: true, premium: true },
  { feature: "Weekly Newsletter", free: true, premium: true },
  { feature: "Advanced Guides & Blueprints", free: false, premium: true },
  { feature: "Done-for-You Templates", free: false, premium: true },
  { feature: "Monthly Trend Reports", free: false, premium: true },
  { feature: "Priority Support", free: false, premium: true },
  { feature: "Early Access to New Tools", free: false, premium: true },
];

export default function PremiumPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            👑 Premium Membership
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Unlock <span className="gradient-text">Premium</span> AI Strategies
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Get exclusive access to advanced AI guides, done-for-you templates,
            and strategies trusted by our community.
          </p>

          {user?.premium ? (
            <div className="inline-block px-6 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              ✅ You&apos;re a Premium Member!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={user ? handleCheckout : undefined}
                disabled={checkoutLoading}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {checkoutLoading
                  ? "Loading..."
                  : user
                    ? "Get Premium Access"
                    : "Get Premium Access"}
              </button>
              {!user && (
                <Link
                  href="/register"
                  className="px-8 py-3 rounded-lg border border-card-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Create Free Account First
                </Link>
              )}
            </div>
          )}

          {!user && !loading && (
            <p className="text-xs text-zinc-600 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:underline">
                Log in
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-8 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <StatsCounter />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            What You Get with Premium
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-card-border bg-card-bg hover:border-purple-500/20 transition-colors"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Premium Comparison */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Free vs <span className="gradient-text">Premium</span>
          </h2>
          <div className="rounded-xl border border-card-border overflow-hidden">
            <div className="grid grid-cols-3 bg-zinc-900/50 p-4 text-sm font-semibold">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-purple-400">Premium</span>
            </div>
            {freeVsPremium.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 p-4 text-sm border-t border-card-border"
              >
                <span className="text-zinc-300">{row.feature}</span>
                <span className="text-center">
                  {row.free ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </span>
                <span className="text-center">
                  <span className="text-emerald-400">✓</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Content Preview */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">
            Premium Content Library
          </h2>
          <p className="text-zinc-400 text-center mb-10">
            Exclusive guides available only to premium members
          </p>
          <div className="space-y-3">
            {premiumArticles.map((article, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border border-card-border bg-card-bg"
              >
                <span className="text-lg">
                  {user?.premium ? "📖" : "🔒"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{article.title}</p>
                </div>
                {user?.premium ? (
                  <span className="text-xs text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10">
                    Read
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500 px-3 py-1 rounded-full bg-zinc-800">
                    Premium
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">
            What Our Community Says
          </h2>
          <p className="text-zinc-400 text-center mb-10">
            Real feedback from readers who use Zoltai
          </p>
          <Testimonials />
        </div>
      </section>

      {/* Pricing */}
      {!user?.premium && (
        <section className="py-16 px-4 border-t border-card-border">
          <div className="max-w-md mx-auto">
            <div className="p-8 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent text-center">
              <p className="text-sm text-purple-400 font-medium mb-2">
                PREMIUM MEMBERSHIP
              </p>
              <p className="text-4xl font-bold mb-1">
                $19<span className="text-lg text-zinc-500">/month</span>
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Cancel anytime. 7-day money-back guarantee.
              </p>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "All premium articles & guides",
                  "Done-for-you templates",
                  "Monthly performance reports",
                  "Priority support",
                  "Early access to new tools",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <span className="text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {user ? (
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="block w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {checkoutLoading ? "Loading..." : "Subscribe Now →"}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="block w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  Create Account to Subscribe
                </Link>
              )}
              <p className="text-xs text-zinc-600 mt-4">
                Secure payment via Stripe. Cancel anytime from your account.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
