"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  [key: string]: string;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
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
    REPORT_EMAIL_TO: "Report Email To",
    IMAGE_PROVIDER: "Image Provider (mock / openai)",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Admin Dashboard</span>
        </h1>
        <a href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          Back to Site
        </a>
      </div>

      {/* Manual Publish Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Manual Publish</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Trigger automation workflows manually.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: "article", label: "New Article", icon: "\u270D\uFE0F" },
            { key: "instagram", label: "Instagram Post", icon: "\uD83D\uDCF8" },
            { key: "seo", label: "SEO Optimize", icon: "\uD83D\uDD0D" },
            { key: "email", label: "Weekly Email", icon: "\u2709\uFE0F" },
            { key: "gsc", label: "GSC Check", icon: "\uD83D\uDCCA" },
          ].map((action) => (
            <button
              key={action.key}
              onClick={() => triggerWorkflow(action.key)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
        {publishStatus && (
          <p className="mt-4 text-sm text-accent-light">{publishStatus}</p>
        )}
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Update API tokens and configuration. Changes take effect after server restart.
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
                  <p className="text-xs text-zinc-600 font-mono mt-1">{key}</p>

                  {editKey === key ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter new value"
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
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
                        className="px-4 py-2 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-white"
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
                    className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-white hover:border-accent/30 transition-colors"
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
