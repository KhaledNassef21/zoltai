"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  premium: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", email: "", password: "" }),
    });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      {/* Profile Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <div className="mt-1.5">
            {user.premium ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                👑 Premium Member
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-card-border">
                Free Account
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Premium Upgrade Card */}
      {!user.premium && (
        <div className="p-5 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Upgrade to Premium</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Get exclusive AI guides, templates, and priority support
              </p>
            </div>
            <Link
              href="/premium"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Account Details */}
      <div className="p-6 rounded-2xl border border-card-border bg-card-bg mb-6">
        <h2 className="text-lg font-semibold mb-4">Account Details</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-card-border">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Name</p>
              <p className="text-sm mt-0.5">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-card-border">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Email</p>
              <p className="text-sm mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Plan</p>
              <p className="text-sm mt-0.5">
                {user.premium ? "Premium ($19/month)" : "Free"}
              </p>
            </div>
            {user.premium && (
              <span className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
                Manage subscription
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/tools"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-purple-500/30 transition-all group"
        >
          <div className="text-2xl mb-2">🛠️</div>
          <p className="font-medium text-sm group-hover:text-purple-300 transition-colors">
            Browse AI Tools
          </p>
          <p className="text-xs text-zinc-500 mt-1">24+ curated tools</p>
        </Link>
        <Link
          href="/blog"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-purple-500/30 transition-all group"
        >
          <div className="text-2xl mb-2">📖</div>
          <p className="font-medium text-sm group-hover:text-purple-300 transition-colors">
            Read Guides
          </p>
          <p className="text-xs text-zinc-500 mt-1">Free AI tutorials</p>
        </Link>
        <Link
          href="/earn"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-purple-500/30 transition-all group"
        >
          <div className="text-2xl mb-2">🚀</div>
          <p className="font-medium text-sm group-hover:text-purple-300 transition-colors">
            Top 10 AI Tools
          </p>
          <p className="text-xs text-zinc-500 mt-1">Curated picks</p>
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-card-border flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          Sign Out
        </button>
        <p className="text-xs text-zinc-600">
          Need help?{" "}
          <Link href="/contact" className="text-purple-400 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
