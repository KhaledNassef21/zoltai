"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { TrendingUp, Users, Eye, MousePointerClick, Mail, FileText } from "lucide-react";

interface Stats {
  articles: number;
  tools: number;
  subscribers: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats>({ articles: 0, tools: 0, subscribers: 0 });
  const [loading, setLoading] = useState(true);
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
      const [articlesRes, toolsRes] = await Promise.all([
        fetch("/api/admin/articles"),
        fetch("/api/admin/tools"),
      ]);

      const articlesData = articlesRes.ok ? await articlesRes.json() : { articles: [] };
      const toolsData = toolsRes.ok ? await toolsRes.json() : { tools: [] };

      setStats({
        articles: articlesData.articles?.length || 0,
        tools: toolsData.tools?.length || 0,
        subscribers: 0,
      });
    } catch {}
    setLoading(false);
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
