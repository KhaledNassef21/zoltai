"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  name: string;
  content: string;
  date: string;
}

export function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    loadComments();
  }, [slug]);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {}
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, content }),
      });

      if (res.ok) {
        setMessage("Comment posted!");
        setMessageType("success");
        setName("");
        setEmail("");
        setContent("");
        loadComments();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to post comment");
        setMessageType("error");
      }
    } catch {
      setMessage("Network error");
      setMessageType("error");
    }

    setSubmitting(false);
    setTimeout(() => setMessage(""), 4000);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <section className="mt-16 pt-8 border-t border-card-border">
      <h3 className="text-2xl font-bold mb-6">
        Comments{" "}
        {comments.length > 0 && (
          <span className="text-zinc-500 text-lg">({comments.length})</span>
        )}
      </h3>

      {/* Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-10 p-6 rounded-xl border border-card-border bg-card-bg"
      >
        <h4 className="text-sm font-medium text-zinc-400 mb-4">
          Leave a comment
        </h4>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
          />
          <input
            type="email"
            placeholder="Email (optional, not shown)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            className="px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <textarea
          placeholder="Write your comment... *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 text-sm focus:outline-none focus:border-accent/50 mb-4"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">{content.length}/2000</p>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-3 text-sm ${
              messageType === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      {/* Comments List */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 rounded-xl border border-card-border bg-card-bg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-sm font-bold">
                  {comment.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{comment.name}</p>
                  <p className="text-xs text-zinc-600">
                    {timeAgo(comment.date)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
