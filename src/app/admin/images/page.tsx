"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/sidebar";
import { Image as ImageIcon, Copy, Check } from "lucide-react";

interface ImageInfo {
  name: string;
  path: string;
  url: string;
  size: string;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (!res.ok) { router.push("/admin/login"); return; }
        loadImages();
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadImages() {
    setLoading(true);
    const res = await fetch("/api/admin/images");
    if (res.ok) {
      const data = await res.json();
      setImages(data.images || []);
    }
    setLoading(false);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Images</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {images.length} image{images.length !== 1 ? "s" : ""} in the library
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500 py-20 text-center">Loading...</p>
      ) : images.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No images found</p>
          <p className="text-xs mt-1">Images are auto-generated with articles</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.path} className="rounded-xl border border-card-border bg-card-bg overflow-hidden group">
              <div className="aspect-video bg-zinc-900 relative">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate">{img.name}</p>
                <p className="text-xs text-zinc-600">{img.size}</p>
                <button
                  onClick={() => copyUrl(img.url)}
                  className="flex items-center gap-1 mt-2 text-xs text-zinc-500 hover:text-accent-light transition-colors"
                >
                  {copied === img.url ? (
                    <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy URL</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
