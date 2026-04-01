"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { ArrowUp, ArrowDown, Star, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  url: string;
  affiliateUrl: string;
  featured?: boolean;
  rating: number;
}

export default function AdminEarnPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) { router.push("/admin/login"); return; }
        loadTools();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadTools() {
    setLoading(true);
    const res = await fetch("/api/admin/tools");
    if (res.ok) {
      const data = await res.json();
      // Sort: featured first, then by rating
      const sorted = [...(data.tools || [])].sort((a: Tool, b: Tool) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.rating - a.rating;
      });
      setTools(sorted);
    }
    setLoading(false);
  }

  async function toggleFeatured(slug: string, currentFeatured: boolean) {
    const res = await fetch("/api/admin/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, featured: !currentFeatured }),
    });

    if (res.ok) {
      setMessage(`Tool ${!currentFeatured ? "featured" : "unfeatured"}!`);
      setTimeout(() => setMessage(""), 3000);
      loadTools();
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Earn Page</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage the /earn page — top tools shown to visitors
          </p>
        </div>
        <Link
          href="/earn"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> View Page
        </Link>
      </div>

      {message && (
        <div className="mb-6 p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {message}
        </div>
      )}

      <div className="p-4 rounded-xl border border-card-border bg-card-bg mb-6">
        <p className="text-sm text-zinc-400">
          The <strong>/earn</strong> page shows the top 10 tools sorted by Featured status and Rating.
          Toggle Featured or update ratings via the <Link href="/admin/tools" className="text-accent-light underline">Tools page</Link> to control which tools appear.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 py-20 text-center">Loading...</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Top 10 shown on /earn (sorted by Featured + Rating):
          </h3>
          {tools.slice(0, 15).map((tool, i) => (
            <div
              key={tool.slug}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                i < 10
                  ? "border-accent/20 bg-accent/5"
                  : "border-card-border bg-card-bg opacity-60"
              }`}
            >
              <span className={`text-lg font-bold w-8 ${i < 10 ? "text-accent-light" : "text-zinc-600"}`}>
                #{i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-xs text-zinc-500">{tool.category}</span>
                  <span className="text-xs text-zinc-600">★ {tool.rating}</span>
                </div>
              </div>
              <button
                onClick={() => toggleFeatured(tool.slug, !!tool.featured)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tool.featured
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-card-bg text-zinc-500 border border-card-border hover:border-yellow-500/30"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${tool.featured ? "fill-yellow-400" : ""}`} />
                {tool.featured ? "Featured" : "Feature"}
              </button>
              {i < 10 && (
                <span className="text-xs text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">
                  Shown
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
