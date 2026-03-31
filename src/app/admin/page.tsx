"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Settings {
  [key: string]: string;
}

interface Stats {
  articles: number;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [stats, setStats] = useState<Stats>({ articles: 0 });
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [message, setMessage] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(true);
        loadSettings();
        loadStats();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  }

  async function loadStats() {
    const res = await fetch("/api/admin/articles");
    if (res.ok) {
      const data = await res.json();
      setStats({ articles: data.articles?.length || 0 });
    }
  }

  async function saveSetting(key: string, value: string) {
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`${key} updated successfully!`);
      setEditKey("");
      setEditValue("");
      loadSettings();
    } else {
      setMessage(`Error: ${data.error}`);
    }
  }

  async function triggerWorkflow(action: string) {
    setPublishStatus(`Triggering ${action}...`);
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setPublishStatus(`${action} triggered! Check GitHub Actions for status.`);
    } else {
      setPublishStatus(`Error: ${data.error}`);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const settingLabels: Record<string, string> = {
    INSTAGRAM_ACCESS_TOKEN: "Instagram Access Token",
    INSTAGRAM_USER_ID: "Instagram User ID",
    ANTHROPIC_API_KEY: "Anthropic (Claude) API Key",
    OPENAI_API_KEY: "OpenAI API Key",
    RESEND_API_KEY: "Resend API Key",
    RESEND_FROM_EMAIL: "Resend From Email",
    RESEND_AUDIENCE_ID: "Resend Audience ID",
    REPORT_EMAIL_TO: "Report Email To",
    IMAGE_PROVIDER: "Image Provider (mock / openai)",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Admin Dashboard</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your Zoltai site</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 rounded-lg border border-card-border text-sm text-zinc-400 hover:text-foreground transition-colors"
        >
          Back to Site
        </a>
      </div>

      {/* Quick Stats */}
      <section className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-card-border bg-card-bg text-center">
            <p className="text-3xl font-bold gradient-text">{stats.articles}</p>
            <p className="text-xs text-zinc-500 mt-1">Articles</p>
          </div>
          <Link
            href="/admin/articles"
            className="p-5 rounded-xl border border-card-border bg-card-bg text-center hover:border-accent/40 transition-all group"
          >
            <p className="text-3xl">📝</p>
            <p className="text-xs text-zinc-500 mt-1 group-hover:text-accent-light">
              Manage Articles
            </p>
          </Link>
          <a
            href="https://github.com/KhaledNassef21/zoltai/actions"
            target="_blank"
            className="p-5 rounded-xl border border-card-border bg-card-bg text-center hover:border-accent/40 transition-all group"
          >
            <p className="text-3xl">⚡</p>
            <p className="text-xs text-zinc-500 mt-1 group-hover:text-accent-light">
              GitHub Actions
            </p>
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            className="p-5 rounded-xl border border-card-border bg-card-bg text-center hover:border-accent/40 transition-all group"
          >
            <p className="text-3xl">▲</p>
            <p className="text-xs text-zinc-500 mt-1 group-hover:text-accent-light">
              Vercel
            </p>
          </a>
        </div>
      </section>

      {/* Manual Publish Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "article", label: "Generate Article", icon: "✍️" },
            { key: "instagram", label: "Instagram Post", icon: "📸" },
            { key: "seo", label: "SEO Optimize", icon: "🔍" },
            { key: "email", label: "Weekly Email", icon: "✉️" },
            { key: "gsc", label: "GSC Check", icon: "📊" },
          ].map((action) => (
            <button
              key={action.key}
              onClick={() => triggerWorkflow(action.key)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
          <Link
            href="/admin/articles"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-accent/30 bg-accent/5 hover:border-accent/50 transition-all text-center"
          >
            <span className="text-2xl">📄</span>
            <span className="text-xs font-medium text-accent-light">
              New Article
            </span>
          </Link>
        </div>
        {publishStatus && (
          <p className="mt-4 text-sm text-accent-light">{publishStatus}</p>
        )}
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Update API tokens and configuration.
        </p>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-accent/10 text-accent-light text-sm">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <div
              key={key}
              className="p-4 rounded-xl border border-card-border bg-card-bg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-zinc-300">
                    {settingLabels[key] || key}
                  </label>
                  <p className="text-xs text-zinc-600 font-mono mt-0.5">{key}</p>

                  {editKey === key ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter new value"
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border text-foreground text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                      />
                      <button
                        onClick={() => saveSetting(key, editValue)}
                        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditKey("");
                          setEditValue("");
                        }}
                        className="px-4 py-2 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 mt-1 font-mono">
                      {value}
                    </p>
                  )}
                </div>

                {editKey !== key && (
                  <button
                    onClick={() => {
                      setEditKey(key);
                      setEditValue("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-foreground hover:border-accent/30 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
