"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/sidebar";
import {
  FileText,
  Wrench,
  Image,
  BarChart3,
  DollarSign,
  Zap,
  Camera,
  Search,
  Mail,
  LineChart,
} from "lucide-react";

interface Stats {
  articles: number;
  tools: number;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats>({ articles: 0, tools: 0 });
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
        loadStats();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadStats() {
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
      });
    } catch {}
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
    setTimeout(() => setPublishStatus(""), 5000);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Welcome back! Manage your Zoltai site.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Link
          href="/admin/articles"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <FileText className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-3xl font-bold">{stats.articles}</p>
          <p className="text-xs text-zinc-500 group-hover:text-accent-light">Articles</p>
        </Link>
        <Link
          href="/admin/tools"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <Wrench className="w-5 h-5 text-cyan-400 mb-2" />
          <p className="text-3xl font-bold">{stats.tools}</p>
          <p className="text-xs text-zinc-500 group-hover:text-accent-light">Tools</p>
        </Link>
        <Link
          href="/admin/images"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <Image className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-3xl font-bold">📸</p>
          <p className="text-xs text-zinc-500 group-hover:text-accent-light">Images</p>
        </Link>
        <Link
          href="/admin/earn"
          className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <DollarSign className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-3xl font-bold">💰</p>
          <p className="text-xs text-zinc-500 group-hover:text-accent-light">Earn Page</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { key: "article", label: "Generate Article", icon: Zap, color: "text-purple-400" },
            { key: "instagram", label: "Instagram Post", icon: Camera, color: "text-pink-400" },
            { key: "seo", label: "SEO Optimize", icon: Search, color: "text-cyan-400" },
            { key: "email", label: "Weekly Email", icon: Mail, color: "text-emerald-400" },
            { key: "gsc", label: "GSC Check", icon: LineChart, color: "text-yellow-400" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => triggerWorkflow(action.key)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all text-center"
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
        {publishStatus && (
          <p className="mt-4 text-sm text-accent-light">{publishStatus}</p>
        )}
      </section>

      {/* External Links */}
      <section>
        <h2 className="text-lg font-bold mb-4">External Tools</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href="https://github.com/KhaledNassef21/zoltai/actions"
            target="_blank"
            className="p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all text-center"
          >
            <p className="text-2xl mb-2">⚡</p>
            <p className="text-sm font-medium">GitHub Actions</p>
            <p className="text-xs text-zinc-500">Automation</p>
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            className="p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all text-center"
          >
            <p className="text-2xl mb-2">▲</p>
            <p className="text-sm font-medium">Vercel</p>
            <p className="text-xs text-zinc-500">Deployments</p>
          </a>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            className="p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all text-center"
          >
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm font-medium">Search Console</p>
            <p className="text-xs text-zinc-500">SEO</p>
          </a>
        </div>
      </section>
    </AdminLayout>
  );
}
