"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Film,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  Hash,
  Music,
  MessageCircle,
  Sparkles,
} from "lucide-react";

interface ReelSummary {
  slug: string;
  title: string;
  generatedAt: string;
  reelCount: number;
}

interface ReelScript {
  id: number;
  format: string;
  hook: string;
  script: string;
  onScreenText: string[];
  cta: string;
  caption: string;
  musicVibe: string;
  duration: string;
}

interface ReelPack {
  slug: string;
  title: string;
  generatedAt: string;
  reels: ReelScript[];
}

const FORMAT_ICONS: Record<string, string> = {
  "Hook/Curiosity": "🪝",
  "Tool Demo": "🛠️",
  "Step-by-Step": "📋",
  "Before/After": "🔄",
  "Money Breakdown": "💰",
  Comparison: "⚔️",
  "Quick Tip": "⚡",
  "Myth Buster": "🤯",
  Story: "📖",
  "List/Ranking": "📊",
};

export default function AdminReelsPage() {
  const [articles, setArticles] = useState<ReelSummary[]>([]);
  const [totalReels, setTotalReels] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [expandedReels, setExpandedReels] = useState<ReelPack | null>(null);
  const [loadingReels, setLoadingReels] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reels")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setTotalReels(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadReels(slug: string) {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      setExpandedReels(null);
      return;
    }

    setLoadingReels(true);
    setExpandedSlug(slug);

    try {
      const res = await fetch("/api/admin/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setExpandedReels(data);
    } catch {
      setExpandedReels(null);
    } finally {
      setLoadingReels(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyFullReel(reel: ReelScript) {
    const text = `🎬 REEL #${reel.id}: ${reel.format}
━━━━━━━━━━━━━━━━━━━━

🪝 HOOK:
${reel.hook}

📝 SCRIPT (${reel.duration}):
${reel.script}

📱 ON-SCREEN TEXT:
${reel.onScreenText.map((t, i) => `${i + 1}. ${t}`).join("\n")}

📣 CTA:
${reel.cta}

📸 CAPTION:
${reel.caption}

🎵 MUSIC: ${reel.musicVibe}`;

    copyToClipboard(text, `full-${reel.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="lg:pl-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Film className="w-6 h-6 text-accent-light" />
                Reels Content
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                10 Reel scripts per article — ready to produce
              </p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-lg bg-card-bg border border-card-border text-center">
                <p className="text-2xl font-bold text-accent-light">
                  {articles.length}
                </p>
                <p className="text-xs text-zinc-500">Articles</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-card-bg border border-card-border text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {totalReels}
                </p>
                <p className="text-xs text-zinc-500">Total Reels</p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">No reels generated yet.</p>
              <p className="text-zinc-600 text-sm mt-2">
                Run: <code className="bg-zinc-800 px-2 py-1 rounded">npx tsx scripts/generate-reels.ts</code>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.slug}>
                  {/* Article Row */}
                  <button
                    onClick={() => loadReels(article.slug)}
                    className="w-full p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold group-hover:text-accent-light transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {article.reelCount} reels
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {expandedSlug === article.slug ? (
                      <ChevronUp className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-500" />
                    )}
                  </button>

                  {/* Expanded Reels */}
                  {expandedSlug === article.slug && (
                    <div className="mt-2 ml-4 space-y-3">
                      {loadingReels ? (
                        <p className="text-zinc-500 py-4">Loading reels...</p>
                      ) : expandedReels?.reels ? (
                        expandedReels.reels.map((reel) => (
                          <div
                            key={reel.id}
                            className="p-5 rounded-xl border border-card-border bg-card-bg/50"
                          >
                            {/* Reel Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {FORMAT_ICONS[reel.format] || "🎬"}
                                </span>
                                <span className="font-semibold text-sm">
                                  #{reel.id} — {reel.format}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light">
                                  {reel.duration}
                                </span>
                              </div>
                              <button
                                onClick={() => copyFullReel(reel)}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors"
                              >
                                {copiedId === `full-${reel.id}` ? (
                                  <>
                                    <Check className="w-3 h-3" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy All
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Hook */}
                            <div className="mb-3">
                              <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">
                                🪝 Hook (First 3 sec)
                              </p>
                              <p className="text-sm font-medium text-amber-400 bg-amber-500/5 p-2 rounded-lg">
                                "{reel.hook}"
                              </p>
                            </div>

                            {/* Script */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-zinc-500 font-semibold uppercase">
                                  📝 Script
                                </p>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      reel.script,
                                      `script-${reel.id}`
                                    )
                                  }
                                  className="text-xs text-zinc-600 hover:text-zinc-400"
                                >
                                  {copiedId === `script-${reel.id}`
                                    ? "✓"
                                    : "Copy"}
                                </button>
                              </div>
                              <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 p-3 rounded-lg">
                                {reel.script}
                              </p>
                            </div>

                            {/* On-Screen Text */}
                            <div className="mb-3">
                              <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">
                                📱 On-Screen Text
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {reel.onScreenText.map((text, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700"
                                  >
                                    {text}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Bottom Row: CTA + Music + Caption */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 rounded-lg bg-zinc-800/50">
                                <span className="text-zinc-500 flex items-center gap-1 mb-1">
                                  <MessageCircle className="w-3 h-3" /> CTA
                                </span>
                                <p className="text-zinc-400">{reel.cta}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-zinc-800/50">
                                <span className="text-zinc-500 flex items-center gap-1 mb-1">
                                  <Music className="w-3 h-3" /> Music
                                </span>
                                <p className="text-zinc-400">{reel.musicVibe}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-zinc-800/50">
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      reel.caption,
                                      `caption-${reel.id}`
                                    )
                                  }
                                  className="w-full text-left"
                                >
                                  <span className="text-zinc-500 flex items-center gap-1 mb-1">
                                    <Hash className="w-3 h-3" /> Caption{" "}
                                    {copiedId === `caption-${reel.id}` && (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    )}
                                  </span>
                                  <p className="text-zinc-400 line-clamp-2">
                                    {reel.caption}
                                  </p>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-500 py-4">
                          No reels data found.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
