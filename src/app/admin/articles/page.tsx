"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import {
  RichEditor,
  htmlToMarkdown,
  markdownToHtml,
} from "@/components/admin/rich-editor";
import { Plus, Pencil, Trash2, ExternalLink, X, Eye, Code, Upload, ImageIcon, RefreshCw, Link2 } from "lucide-react";

interface AffiliateLink {
  name: string;
  url: string;
}

interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  wordCount: number;
  affiliateLinks?: AffiliateLink[];
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [editorMode, setEditorMode] = useState<"rich" | "markdown">("rich");
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    htmlContent: "",
    tags: "",
    author: "Zoltai",
    image: "",
  });
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [regeneratingImages, setRegeneratingImages] = useState(false);
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
    // Get the final markdown content
    const finalContent =
      editorMode === "rich"
        ? htmlToMarkdown(form.htmlContent)
        : form.content;

    if (!form.title || !finalContent) {
      showMessage("Title and content are required", "error");
      return;
    }

    const method = editSlug ? "PUT" : "POST";
    const validLinks = affiliateLinks.filter((l) => l.name.trim() && l.url.trim());
    const body = {
      ...(editSlug ? { slug: editSlug } : {}),
      title: form.title,
      description: form.description,
      content: finalContent,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: form.author,
      image: form.image,
      affiliateLinks: validLinks,
    };

    try {
      const res = await fetch("/api/admin/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        let msg = editSlug ? "Article updated!" : "Article created!";
        if (data.note) msg += ` ${data.note}`;
        showMessage(msg, "success");
        resetEditor();
        loadArticles();
      } else {
        const data = await res.json();
        showMessage(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      showMessage(`Error: ${(err as Error).message}`, "error");
    }
  }

  async function openEditor(article?: Article) {
    if (article) {
      setEditSlug(article.slug);
      setForm({
        title: article.title,
        description: article.description,
        content: "",
        htmlContent: "",
        tags: article.tags.join(", "),
        author: article.author,
        image: article.image,
      });
      setImagePreview(article.image || null);
      setAffiliateLinks(article.affiliateLinks || []);
      setShowEditor(true);

      // Load the actual content for editing
      setLoadingContent(true);
      try {
        const res = await fetch(
          `/api/admin/articles?slug=${article.slug}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            const html = markdownToHtml(data.content);
            setForm((prev) => ({
              ...prev,
              content: data.content,
              htmlContent: html,
            }));
          }
          if (data.affiliateLinks) {
            setAffiliateLinks(data.affiliateLinks);
          }
        }
      } catch (err) {
        console.error("Failed to load article content:", err);
      }
      setLoadingContent(false);
    } else {
      setEditSlug(null);
      setForm({
        title: "",
        description: "",
        content: "",
        htmlContent: "",
        tags: "",
        author: "Zoltai",
        image: "",
      });
      setAffiliateLinks([]);
      setShowEditor(true);
    }
  }

  function resetEditor() {
    setShowEditor(false);
    setEditSlug(null);
    setEditorMode("rich");
    setImagePreview(null);
    setAffiliateLinks([]);
    setForm({
      title: "",
      description: "",
      content: "",
      htmlContent: "",
      tags: "",
      author: "Zoltai",
      image: "",
    });
  }

  function toggleEditorMode() {
    if (editorMode === "rich") {
      // Switch to markdown — convert current HTML
      const md = htmlToMarkdown(form.htmlContent);
      setForm((prev) => ({ ...prev, content: md }));
      setEditorMode("markdown");
    } else {
      // Switch to rich — convert current markdown
      const html = markdownToHtml(form.content);
      setForm((prev) => ({ ...prev, htmlContent: html }));
      setEditorMode("rich");
    }
  }

  const filteredArticles = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500">Loading articles...</p>
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
            <span className="gradient-text">Articles</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {articles.length} article{articles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Article
        </button>
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

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-6 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-card-bg border border-card-border rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editSlug ? "Edit Article" : "New Article"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Editor Mode Toggle */}
                <button
                  onClick={toggleEditorMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    editorMode === "rich"
                      ? "border-accent/30 text-accent-light bg-accent/10"
                      : "border-card-border text-zinc-400 hover:text-foreground"
                  }`}
                  title={
                    editorMode === "rich"
                      ? "Switch to Markdown"
                      : "Switch to Rich Editor"
                  }
                >
                  {editorMode === "rich" ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Rich
                    </>
                  ) : (
                    <>
                      <Code className="w-3.5 h-3.5" /> Markdown
                    </>
                  )}
                </button>
                <button
                  onClick={resetEditor}
                  className="text-zinc-500 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
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
                <p className="text-xs text-zinc-600 mt-1">
                  {form.description.length}/160 characters
                </p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Content *
                  {loadingContent && (
                    <span className="ml-2 text-accent-light">
                      Loading...
                    </span>
                  )}
                </label>

                {editorMode === "rich" ? (
                  <RichEditor
                    content={form.htmlContent}
                    onChange={(html) =>
                      setForm((prev) => ({
                        ...prev,
                        htmlContent: html,
                      }))
                    }
                    placeholder="Write your article..."
                  />
                ) : (
                  <>
                    <textarea
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                      placeholder="Write your article in Markdown..."
                      rows={20}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      {
                        form.content
                          .split(/\s+/)
                          .filter(Boolean).length
                      }{" "}
                      words
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) =>
                      setForm({ ...form, tags: e.target.value })
                    }
                    placeholder="AI, Productivity, Tools"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Author
                  </label>
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

              {/* Cover Image — URL input + upload + preview */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Cover Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => {
                      setForm({ ...form, image: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                    placeholder="/images/blog/my-article.jpg"
                    className="flex-1 px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
                  />
                  <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-card-border text-zinc-400 hover:text-foreground hover:border-accent/30 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">{uploading ? "..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const base64 = (reader.result as string).split(",")[1];
                            const res = await fetch("/api/admin/upload", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                filename: file.name,
                                data: base64,
                                folder: "blog",
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setForm((prev) => ({ ...prev, image: data.url }));
                              setImagePreview(data.url);
                              showMessage("Image uploaded!", "success");
                            } else {
                              showMessage(data.error || "Upload failed", "error");
                            }
                            setUploading(false);
                          };
                          reader.readAsDataURL(file);
                        } catch {
                          showMessage("Upload failed", "error");
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                  {editSlug && (
                    <button
                      type="button"
                      onClick={async () => {
                        setRegeneratingImages(true);
                        try {
                          const res = await fetch("/api/admin/regenerate-images", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug: editSlug }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            if (data.coverImage) {
                              setForm((prev) => ({ ...prev, image: data.coverImage }));
                              setImagePreview(data.coverImage);
                            }
                            showMessage("Images regenerated with AI!", "success");
                          } else {
                            showMessage(data.error || "Regeneration failed", "error");
                          }
                        } catch {
                          showMessage("Regeneration failed", "error");
                        }
                        setRegeneratingImages(false);
                      }}
                      disabled={regeneratingImages}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                      title="Regenerate cover + Instagram images with AI"
                    >
                      <RefreshCw className={`w-4 h-4 ${regeneratingImages ? "animate-spin" : ""}`} />
                      <span className="text-sm whitespace-nowrap">{regeneratingImages ? "Generating..." : "AI Generate"}</span>
                    </button>
                  )}
                </div>

                {/* Image Preview */}
                {(imagePreview || form.image) && (
                  <div className="mt-3 relative group">
                    <div className="rounded-lg overflow-hidden border border-card-border bg-background">
                      <img
                        src={imagePreview || form.image}
                        alt="Cover preview"
                        className="w-full max-h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = "block";
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image: "" }));
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Affiliate Links */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <Link2 className="w-4 h-4" />
                  Affiliate Links
                </label>
                <div className="space-y-2">
                  {affiliateLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => {
                          const updated = [...affiliateLinks];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setAffiliateLinks(updated);
                        }}
                        placeholder="Tool name (e.g. ElevenLabs)"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...affiliateLinks];
                          updated[i] = { ...updated[i], url: e.target.value };
                          setAffiliateLinks(updated);
                        }}
                        placeholder="https://affiliate-link.com/ref=zoltai"
                        className="flex-[2] px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
                      />
                      <button
                        type="button"
                        onClick={() => setAffiliateLinks(affiliateLinks.filter((_, idx) => idx !== i))}
                        className="p-2.5 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAffiliateLinks([...affiliateLinks, { name: "", url: "" }])}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-card-border text-zinc-500 hover:text-accent-light hover:border-accent/30 text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Affiliate Link
                </button>
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
      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-lg">No articles found</p>
          <p className="text-sm mt-1">
            Create your first article or trigger the AI article generator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <div
              key={article.slug}
              className="p-5 rounded-xl border border-card-border bg-card-bg hover:border-card-border/80 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <time className="text-xs text-zinc-600">
                      {article.date}
                    </time>
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
                    className="p-2 rounded-lg border border-card-border text-zinc-400 hover:text-foreground transition-colors"
                    title="View"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => openEditor(article)}
                    className="p-2 rounded-lg border border-card-border text-zinc-400 hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
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
      )}
    </AdminLayout>
  );
}
