"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { Check, X, Trash2, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  slug: string;
  name: string;
  email: string;
  content: string;
  date: string;
  approved: boolean;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        loadComments();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadComments() {
    setLoading(true);
    const res = await fetch("/api/admin/comments");
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
    setLoading(false);
  }

  async function handleApprove(
    slug: string,
    commentId: string,
    approved: boolean
  ) {
    const res = await fetch("/api/admin/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, commentId, approved }),
    });
    if (res.ok) {
      setMessage(approved ? "Comment approved!" : "Comment hidden!");
      setTimeout(() => setMessage(""), 3000);
      loadComments();
    }
  }

  async function handleDelete(slug: string, commentId: string) {
    const res = await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, commentId }),
    });
    if (res.ok) {
      setMessage("Comment deleted!");
      setTimeout(() => setMessage(""), 3000);
      loadComments();
    }
  }

  const filteredComments = comments.filter((c) => {
    if (filter === "pending") return !c.approved;
    if (filter === "approved") return c.approved;
    return true;
  });

  const pendingCount = comments.filter((c) => !c.approved).length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Comments</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {comments.length} total &middot; {pendingCount} pending
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-accent/15 text-accent-light border border-accent/20"
                : "text-zinc-400 border border-card-border hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 py-20 text-center">Loading...</p>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No comments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border bg-card-bg ${
                comment.approved
                  ? "border-card-border"
                  : "border-yellow-500/20 bg-yellow-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium">{comment.name}</span>
                    <span className="text-xs text-zinc-600">
                      on{" "}
                      <a
                        href={`/blog/${comment.slug}`}
                        target="_blank"
                        className="text-accent-light hover:underline"
                      >
                        {comment.slug}
                      </a>
                    </span>
                    <span className="text-xs text-zinc-700">
                      {new Date(comment.date).toLocaleDateString()}
                    </span>
                    {!comment.approved && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {comment.email && (
                    <p className="text-xs text-zinc-600 mt-1">
                      {comment.email}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!comment.approved ? (
                    <button
                      onClick={() =>
                        handleApprove(comment.slug, comment.id, true)
                      }
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleApprove(comment.slug, comment.id, false)
                      }
                      className="p-2 rounded-lg border border-card-border text-zinc-400 hover:text-foreground transition-colors"
                      title="Hide"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.slug, comment.id)}
                    className="p-2 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
