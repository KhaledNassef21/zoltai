"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  premium: boolean;
}

export function UserMenu() {
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

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3 py-1.5 rounded-lg border border-accent/30 text-accent-light text-xs font-medium hover:bg-accent/10 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="flex items-center gap-1.5"
      title={user.name}
    >
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      {user.premium && <span className="text-xs">👑</span>}
    </Link>
  );
}
