"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  wordCount: number;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    tags: "",
    author: "Zoltai",
    image: "",
  });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        loadArticles();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadArticles() {
    setLoading(true);
    const res = await fetch("/api/admin/articles");
    if (res.ok) {
      const data = await res.json();
      setArticles(data.articles);
    }
    setLoading(false);
  }

  function showMessage(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleDelete(slug: string) {
    const res = await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    if (res.ok) {
      showMessage(`Article "${slug}" deleted successfully`, "success");
      setDeleteConfirm(null);
      loadArticles();
    } else {
      const data = await res.json();
      showMessage(`Error: ${data.error}`, "error");
    }
  }

  async function handleSave() {
    const method = editSlug ? "PUT" : "POST";
    const body = editSlug
      ? {
          slug: editSlug,
          title: form.title,
          description: form.description,
          content: form.content,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          author: form.author,
          image: form.image,
        }
      : {
          title: form.title,
          description: form.description,
          content: form.content,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          author: form.author,
          image: form.image,
        };

    const res = await fetch("/api/admin/articles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showMessage(
        editSlug ? "Article updated!" : "Article created!",
        "success"
      );
      resetEditor();
      loadArticles();
    } else {
      const data = await res.json();
      showMessage(`Error: ${data.error}`, "error");
    }
  }

  function openEditor(article?: Article) {
    if (article) {
      setEditSlug(article.slug);
      setForm({
        title: article.title,
        description: article.description,
        content: "", // Will be loaded separately or user edits
        tags: article.tags.join(", "),
        author: article.author,
        image: article.image,
      });
    } else {
      setEditSlug(null);
      setForm({
        title: "",
        description: "",
        content: "",
        tags: "",
        author: "Zoltai",
        image: "",
      });
    }
    setShowEditor(true);
  }

  function resetEditor() {
    setShowEditor(false);
    setEditSlug(null);
    setForm({
      title: "",
      description: "",
      content: "",
      tags: "",
      author: "Zoltai",
      image: "",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Articles</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {articles.length} article{articles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-foreground transition-colors"
          >
            ← Dashboard
          </Link>
          <button
            onClick={() => openEditor()}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
          >
            + New Article
          </button>
        </div>
      </div>

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

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-card-bg border border-card-border rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editSlug ? "Edit Article" : "New Article"}
              </h2>
              <button
                onClick={resetEditor}
                className="text-zinc-500 hover:text-foreground text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Article title"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Description (SEO)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Meta description (155 chars max)"
                  maxLength={160}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Content (Markdown) *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Write your article in Markdown..."
                  rows={15}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="AI, Productivity, Tools"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Author</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) =>
                      setForm({ ...form, author: e.target.value })
                    }
                    placeholder="Zoltai"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/images/blog/my-article.png"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={resetEditor}
                  className="px-5 py-2.5 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title || !form.content}
                  className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium disabled:opacity-40"
                >
                  {editSlug ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-lg">No articles yet</p>
          <p className="text-sm mt-1">
            Create your first article or trigger the AI article generator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.slug}
              className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-card-border/80 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <time className="text-xs text-zinc-600">{article.date}</time>
                    <span className="text-xs text-zinc-700">·</span>
                    <span className="text-xs text-zinc-600">
                      {article.wordCount} words
                    </span>
                    <span className="text-xs text-zinc-700">·</span>
                    <span className="text-xs text-zinc-600">
                      {article.author}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground truncate">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 truncate">
                    {article.description}
                  </p>
                  {article.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-foreground hover:border-accent/30 transition-colors"
                  >
                    View
                  </a>
                  <button
                    onClick={() => openEditor(article)}
                    className="px-3 py-1.5 rounded-lg border border-card-border text-zinc-400 text-xs hover:text-foreground hover:border-accent/30 transition-colors"
                  >
                    Edit
                  </button>
                  {deleteConfirm === article.slug ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(article.slug)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30"
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
                      onClick={() => setDeleteConfirm(article.slug)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 text-xs hover:text-red-400 hover:border-red-500/40 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
