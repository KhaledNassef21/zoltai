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

  // Edit states
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setEditName(data.user.name);
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

  function showMsg(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditing(false);
        showMsg("Name updated successfully", "success");
      } else {
        showMsg(data.error || "Failed to update", "error");
      }
    } catch {
      showMsg("Network error", "error");
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPassword || passedChecks < 4) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPasswordChange(false);
        setCurrentPassword("");
        setNewPassword("");
        showMsg("Password changed successfully", "success");
      } else {
        showMsg(data.error || "Failed to change password", "error");
      }
    } catch {
      showMsg("Network error", "error");
    }
    setSaving(false);
  }

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
      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm ${
            messageType === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message}
        </div>
      )}

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
                Premium Member
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-card-border">
                Free Account
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Premium Upgrade */}
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
          {/* Name - Editable */}
          <div className="flex items-center justify-between py-3 border-b border-card-border">
            <div className="flex-1">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Name</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-purple-500/50"
                    maxLength={100}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving || !editName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium disabled:opacity-50"
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditName(user.name);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm">{user.name}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email - Read-only */}
          <div className="flex items-center justify-between py-3 border-b border-card-border">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Email</p>
              <p className="text-sm mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Password */}
          <div className="py-3 border-b border-card-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Password</p>
                <p className="text-sm mt-0.5 text-zinc-500">********</p>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                {showPasswordChange ? "Cancel" : "Change"}
              </button>
            </div>

            {showPasswordChange && (
              <div className="mt-4 space-y-3 p-4 rounded-lg bg-background border border-card-border">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-card-bg border border-card-border text-foreground text-sm focus:outline-none focus:border-purple-500/50"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      {showCurrentPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-card-bg border border-card-border text-foreground text-sm focus:outline-none focus:border-purple-500/50"
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      {showNewPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      {[
                        { label: "8+ characters", ok: passwordChecks.length },
                        { label: "Uppercase", ok: passwordChecks.uppercase },
                        { label: "Lowercase", ok: passwordChecks.lowercase },
                        { label: "Number", ok: passwordChecks.number },
                      ].map((check) => (
                        <span
                          key={check.label}
                          className={check.ok ? "text-emerald-400" : "text-zinc-600"}
                        >
                          {check.ok ? "✓" : "○"} {check.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || passedChecks < 4}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-all"
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </div>
            )}
          </div>

          {/* Plan */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Plan</p>
              <p className="text-sm mt-0.5">
                {user.premium ? "Premium" : "Free"}
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

      {/* Sign Out */}
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
