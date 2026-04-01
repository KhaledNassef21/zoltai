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
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">
        <span className="gradient-text">My Profile</span>
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Welcome back, {user.name}!
      </p>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl border border-card-border bg-card-bg mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-background border border-card-border">
          <span className="text-2xl">
            {user.premium ? "👑" : "⭐"}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {user.premium ? "Premium Member" : "Free Account"}
            </p>
            <p className="text-xs text-zinc-500">
              {user.premium
                ? "You have access to all premium content"
                : "Upgrade to unlock exclusive AI guides and strategies"}
            </p>
          </div>
          {!user.premium && (
            <Link
              href="/premium"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/earn"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all"
        >
          <p className="text-2xl mb-2">💰</p>
          <p className="font-medium text-sm">Earn with AI</p>
          <p className="text-xs text-zinc-500">Top tools to start earning</p>
        </Link>
        <Link
          href="/blog"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all"
        >
          <p className="text-2xl mb-2">📖</p>
          <p className="font-medium text-sm">Read Guides</p>
          <p className="text-xs text-zinc-500">Free AI tutorials and tips</p>
        </Link>
        <Link
          href="/tools"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all"
        >
          <p className="text-2xl mb-2">🛠️</p>
          <p className="font-medium text-sm">Browse Tools</p>
          <p className="text-xs text-zinc-500">24+ AI tools directory</p>
        </Link>
        {user.premium && (
          <Link
            href="/premium"
            className="p-5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 transition-all"
          >
            <p className="text-2xl mb-2">👑</p>
            <p className="font-medium text-sm">Premium Content</p>
            <p className="text-xs text-zinc-500">Exclusive strategies</p>
          </Link>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-5 py-2.5 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-red-400 hover:border-red-500/30 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
