"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  premium: boolean;
}

const premiumFeatures = [
  {
    icon: "🎯",
    title: "Advanced AI Money Strategies",
    description: "Step-by-step blueprints for building $5K+/month AI businesses",
  },
  {
    icon: "📊",
    title: "Exclusive Tool Comparisons",
    description: "In-depth reviews with ROI calculations and real earnings data",
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
    title: "Monthly Earnings Reports",
    description: "See what's working now with real income breakdowns",
  },
  {
    icon: "🚀",
    title: "Early Access",
    description: "Be the first to know about new tools and opportunities",
  },
];

const premiumArticles = [
  {
    title: "How I Built a $10K/Month AI Content Agency (Full Blueprint)",
    locked: true,
  },
  {
    title: "The Complete ChatGPT Freelancing Playbook: From $0 to $5K",
    locked: true,
  },
  {
    title: "AI Automation Secrets: 7 Workflows That Generate Passive Income",
    locked: true,
  },
  {
    title: "Advanced Midjourney for Print-on-Demand: $3K/Month Strategy",
    locked: true,
  },
  {
    title: "Building SaaS Tools with AI: Zero-Code to Revenue",
    locked: true,
  },
];

export default function PremiumPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
            Get exclusive access to advanced money-making guides, done-for-you templates,
            and strategies that are generating real income for our members.
          </p>

          {user?.premium ? (
            <div className="inline-block px-6 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              ✅ You&apos;re a Premium Member!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:info.zoltai@gmail.com?subject=Premium%20Membership&body=I%20want%20to%20join%20Zoltai%20Premium!"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Get Premium — Contact Us
              </a>
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
                className="p-6 rounded-xl border border-card-border bg-card-bg"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
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
                  "Monthly earnings reports",
                  "Priority support",
                  "Early access to new tools",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:info.zoltai@gmail.com?subject=Premium%20Membership&body=I%20want%20to%20join%20Zoltai%20Premium!%20($19/month)"
                className="block w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Get Premium Access
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
