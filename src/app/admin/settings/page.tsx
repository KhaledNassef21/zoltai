"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { Eye, EyeOff, Save } from "lucide-react";

interface Settings {
  [key: string]: string;
}

const settingLabels: Record<string, { label: string; description: string }> = {
  INSTAGRAM_ACCESS_TOKEN: { label: "Instagram Access Token", description: "Token for Instagram Graph API" },
  INSTAGRAM_USER_ID: { label: "Instagram User ID", description: "Instagram Business Account ID" },
  FACEBOOK_PAGE_ID: { label: "Facebook Page ID", description: "Facebook Page ID for cross-posting" },
  FACEBOOK_PAGE_ACCESS_TOKEN: { label: "Facebook Page Token", description: "Never-expire Page Access Token" },
  ANTHROPIC_API_KEY: { label: "Anthropic (Claude) API Key", description: "For article generation" },
  OPENAI_API_KEY: { label: "OpenAI API Key", description: "For AI features" },
  RESEND_API_KEY: { label: "Resend API Key", description: "For newsletter emails" },
  RESEND_FROM_EMAIL: { label: "Resend From Email", description: "Sender email address" },
  RESEND_AUDIENCE_ID: { label: "Resend Audience ID", description: "Newsletter audience" },
  REPORT_EMAIL_TO: { label: "Report Email To", description: "Weekly report recipient" },
  IMAGE_PROVIDER: { label: "Image Provider", description: "Image generation service (pollinations)" },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) { router.push("/admin/login"); return; }
        loadSettings();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadSettings() {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings || {});
    }
    setLoading(false);
  }

  async function saveSetting(key: string, value: string) {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (res.ok) {
      setMessage(`${key} updated!`);
      setTimeout(() => setMessage(""), 3000);
      setEditKey("");
      setEditValue("");
      loadSettings();
    } else {
      const data = await res.json();
      setMessage(`Error: ${data.error}`);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          API keys and configuration
        </p>
      </div>

      {message && (
        <div className="mb-6 p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 py-20 text-center">Loading...</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => {
            const info = settingLabels[key] || { label: key, description: "" };
            const isSensitive = key.includes("KEY") || key.includes("TOKEN") || key.includes("PASSWORD") || key.includes("SECRET");
            const isRevealed = showValues[key];

            return (
              <div key={key} className="p-4 rounded-xl border border-card-border bg-card-bg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-300">{info.label}</span>
                      <span className="text-xs text-zinc-700 font-mono">{key}</span>
                    </div>
                    {info.description && (
                      <p className="text-xs text-zinc-600 mb-2">{info.description}</p>
                    )}

                    {editKey === key ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Enter new value"
                          className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border text-foreground text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                        />
                        <button
                          onClick={() => saveSetting(key, editValue)}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => { setEditKey(""); setEditValue(""); }}
                          className="px-4 py-2 rounded-lg border border-card-border text-zinc-400 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-zinc-500 font-mono">
                          {isSensitive && !isRevealed ? "•".repeat(Math.min(value.length, 20)) : value}
                        </p>
                        {isSensitive && (
                          <button
                            onClick={() => setShowValues({ ...showValues, [key]: !isRevealed })}
                            className="p-1 text-zinc-600 hover:text-zinc-400"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editKey !== key && (
                    <button
                      onClick={() => { setEditKey(key); setEditValue(""); }}
                      className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-foreground hover:border-accent/30 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
