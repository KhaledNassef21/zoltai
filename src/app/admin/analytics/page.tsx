"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { TrendingUp, MousePointerClick, Mail, FileText, Activity, Trash2 } from "lucide-react";

interface Stats {
  articles: number;
  tools: number;
  subscribers: number;
}

interface LiveEvent {
  event: string;
  variant: string;
  page: string;
  ua: string;
  ip: string;
  ts: string;
}

interface LiveData {
  configured: boolean;
  count?: number;
  events?: LiveEvent[];
  summary?: {
    total: number;
    byEvent: { key: string; count: number }[];
    byPage: { key: string; count: number }[];
    byDay: { day: string; count: number }[];
  };
  error?: string;
  message?: string;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats>({ articles: 0, tools: 0, subscribers: 0 });
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) { router.push("/admin/login"); return; }
        loadStats();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadStats() {
    setLoading(true);
    try {
      const [articlesRes, toolsRes, liveRes] = await Promise.all([
        fetch("/api/admin/articles"),
        fetch("/api/admin/tools"),
        fetch("/api/admin/analytics?n=500"),
      ]);

      const articlesData = articlesRes.ok ? await articlesRes.json() : { articles: [] };
      const toolsData = toolsRes.ok ? await toolsRes.json() : { tools: [] };
      const liveData = liveRes.ok ? await liveRes.json() : null;

      setStats({
        articles: articlesData.articles?.length || 0,
        tools: toolsData.tools?.length || 0,
        subscribers: 0,
      });
      setLive(liveData);
    } catch {}
    setLoading(false);
  }

  async function clearEvents() {
    if (!confirm("Clear all live events from Upstash? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch("/api/admin/analytics", { method: "DELETE" });
      await loadStats();
    } catch {}
    setClearing(false);
  }

  const cards = [
    { label: "Total Articles", value: stats.articles, icon: FileText, color: "text-purple-400" },
    { label: "AI Tools", value: stats.tools, icon: MousePointerClick, color: "text-cyan-400" },
    { label: "Newsletter Subs", value: stats.subscribers, icon: Mail, color: "text-emerald-400" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your site performance</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 py-20 text-center">Loading...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="p-6 rounded-xl border border-card-border bg-card-bg">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${card.color}`} />
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold">{card.value}</p>
                  <p className="text-sm text-zinc-500 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Live Events (Upstash) */}
          <div className="p-6 rounded-xl border border-card-border bg-card-bg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold">Live Events</h3>
                {live?.configured && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                    {live.count || 0} events
                  </span>
                )}
              </div>
              {live?.configured && (live.count || 0) > 0 && (
                <button
                  onClick={clearEvents}
                  disabled={clearing}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  {clearing ? "Clearing..." : "Clear all"}
                </button>
              )}
            </div>

            {!live?.configured ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200">
                <p className="font-medium mb-1">Upstash Redis not configured</p>
                <p className="text-xs text-amber-200/80">
                  Set <code className="bg-black/30 px-1 rounded">UPSTASH_REDIS_REST_URL</code> and{" "}
                  <code className="bg-black/30 px-1 rounded">UPSTASH_REDIS_REST_TOKEN</code> in Vercel env vars.
                </p>
              </div>
            ) : live.error ? (
              <p className="text-sm text-red-300">{live.error}</p>
            ) : (live.count || 0) === 0 ? (
              <p className="text-sm text-zinc-500">No events yet. They&apos;ll appear here as visitors interact with the site.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Top Events</p>
                  <div className="space-y-1.5">
                    {live.summary?.byEvent.slice(0, 8).map((e) => (
                      <div key={e.key} className="flex justify-between text-sm">
                        <span className="text-zinc-300 truncate mr-2">{e.key}</span>
                        <span className="text-zinc-500 tabular-nums">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Top Pages</p>
                  <div className="space-y-1.5">
                    {live.summary?.byPage.slice(0, 8).map((p) => (
                      <div key={p.key} className="flex justify-between text-sm">
                        <span className="text-zinc-300 truncate mr-2" title={p.key}>{p.key || "/"}</span>
                        <span className="text-zinc-500 tabular-nums">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Recent Activity</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-card-border">
                          <th className="py-2 pr-4 font-medium">Time</th>
                          <th className="py-2 pr-4 font-medium">Event</th>
                          <th className="py-2 font-medium">Page</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(live.events || []).slice(0, 15).map((ev, i) => (
                          <tr key={i} className="border-b border-card-border/50">
                            <td className="py-2 pr-4 text-zinc-500 tabular-nums whitespace-nowrap">
                              {ev.ts ? new Date(ev.ts).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 pr-4 text-zinc-300">{ev.event}</td>
                            <td className="py-2 text-zinc-400 truncate max-w-xs" title={ev.page}>{ev.page || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 rounded-xl border border-card-border bg-card-bg">
            <h3 className="font-semibold mb-3">Advanced Analytics</h3>
            <p className="text-sm text-zinc-400 mb-4">
              For detailed visitor analytics, page views, and traffic sources, use these external tools:
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                className="p-4 rounded-lg border border-card-border hover:border-accent/30 transition-colors text-center"
              >
                <p className="text-2xl mb-2">▲</p>
                <p className="text-sm font-medium">Vercel Analytics</p>
                <p className="text-xs text-zinc-500">Visitors & Web Vitals</p>
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                className="p-4 rounded-lg border border-card-border hover:border-accent/30 transition-colors text-center"
              >
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm font-medium">Google Search Console</p>
                <p className="text-xs text-zinc-500">SEO & Search Performance</p>
              </a>
              <a
                href="https://github.com/KhaledNassef21/zoltai/actions"
                target="_blank"
                className="p-4 rounded-lg border border-card-border hover:border-accent/30 transition-colors text-center"
              >
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-sm font-medium">GitHub Actions</p>
                <p className="text-xs text-zinc-500">Automation Status</p>
              </a>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
