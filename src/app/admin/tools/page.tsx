"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { Plus, Pencil, Trash2, ExternalLink, Star, X } from "lucide-react";

interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  useCase: string;
  pricing: string;
  pricingDetail: string;
  url: string;
  affiliateUrl: string;
  featured?: boolean;
  rating: number;
}

const categories = [
  "AI Chatbot", "AI Writing", "AI Image", "AI Coding",
  "SEO", "Productivity", "Hosting", "Research",
];

const pricingOptions = ["Free", "Freemium", "Paid", "Free Trial"];

const emptyTool: Tool = {
  name: "", slug: "", description: "", category: "AI Chatbot",
  useCase: "", pricing: "Freemium", pricingDetail: "",
  url: "", affiliateUrl: "", featured: false, rating: 4,
};

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState<Tool>(emptyTool);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
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
      setTools(data.tools || []);
    }
    setLoading(false);
  }

  function showMsg(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleSave() {
    const method = editSlug ? "PUT" : "POST";
    const { slug: _formSlug, ...formWithoutSlug } = form;
    const body = editSlug ? { slug: editSlug, ...formWithoutSlug } : form;

    const res = await fetch("/api/admin/tools", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showMsg(editSlug ? "Tool updated!" : "Tool created!", "success");
      setShowEditor(false);
      setEditSlug(null);
      setForm(emptyTool);
      loadTools();
    } else {
      const data = await res.json();
      showMsg(`Error: ${data.error}`, "error");
    }
  }

  async function handleDelete(slug: string) {
    const res = await fetch("/api/admin/tools", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    if (res.ok) {
      showMsg("Tool deleted!", "success");
      setDeleteConfirm(null);
      loadTools();
    } else {
      const data = await res.json();
      showMsg(`Error: ${data.error}`, "error");
    }
  }

  const filteredTools = tools.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase());
    const matchCategory = filterCategory === "All" || t.category === filterCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500">Loading tools...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Tools</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {tools.length} tool{tools.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyTool); setEditSlug(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Tool
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${
          messageType === "success"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-accent/50"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tools List */}
      <div className="space-y-3">
        {filteredTools.map((tool) => (
          <div
            key={tool.slug}
            className="p-4 rounded-xl border border-card-border bg-card-bg hover:border-card-border/80 transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{tool.name}</h3>
                  {tool.featured && (
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light">
                    {tool.category}
                  </span>
                  <span className="text-xs text-zinc-600">{tool.pricing}</span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{tool.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={tool.url}
                  target="_blank"
                  className="p-2 rounded-lg border border-card-border text-zinc-400 hover:text-foreground transition-colors"
                  title="Visit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => {
                    setForm(tool);
                    setEditSlug(tool.slug);
                    setShowEditor(true);
                  }}
                  className="p-2 rounded-lg border border-card-border text-zinc-400 hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteConfirm === tool.slug ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(tool.slug)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(tool.slug)}
                    className="p-2 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-card-bg border border-card-border rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editSlug ? "Edit Tool" : "Add New Tool"}
              </h2>
              <button
                onClick={() => { setShowEditor(false); setEditSlug(null); setForm(emptyTool); }}
                className="text-zinc-500 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ChatGPT Plus"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Auto-generated from name"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tool description..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Use Case</label>
                <input
                  type="text"
                  value={form.useCase}
                  onChange={(e) => setForm({ ...form, useCase: e.target.value })}
                  placeholder="What is this tool best for?"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Pricing</label>
                  <select
                    value={form.pricing}
                    onChange={(e) => setForm({ ...form, pricing: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                  >
                    {pricingOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Pricing Detail</label>
                <input
                  type="text"
                  value={form.pricingDetail}
                  onChange={(e) => setForm({ ...form, pricingDetail: e.target.value })}
                  placeholder="Free tier available. Pro $20/month."
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Website URL *</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Affiliate URL</label>
                  <input
                    type="url"
                    value={form.affiliateUrl}
                    onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
                    placeholder="https://example.com/?ref=zoltai"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured || false}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-card-border bg-background text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-zinc-400">Featured Tool</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setShowEditor(false); setEditSlug(null); setForm(emptyTool); }}
                  className="px-5 py-2.5 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.url}
                  className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium disabled:opacity-40"
                >
                  {editSlug ? "Update Tool" : "Add Tool"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
