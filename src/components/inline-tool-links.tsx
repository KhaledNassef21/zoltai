"use client";

import { useEffect, useRef } from "react";
import { tools } from "@/data/tools";

/**
 * InlineToolLinks — client-side enhancement that auto-links tool names in
 * article prose to their tool directory pages + affiliate URLs.
 *
 * Strategy:
 *  - After MDX renders, walk through <p> / <li> text nodes inside .prose
 *  - For each tool in our catalog, replace the FIRST mention (to avoid keyword
 *    stuffing) with an <a> pointing to /tools/<slug>
 *  - This boosts internal linking (SEO) + affiliate CTR without manual effort
 *  - Skip nodes inside <a>, <code>, <pre>, <h1-h6> to preserve semantics
 *
 * Runs once per mount. Safe to include on every blog post.
 */
export function InlineToolLinks() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const article = document.querySelector(".prose");
    if (!article) return;

    // Build a map of tool-name → slug (longest first so "ChatGPT Plus" wins
    // over "ChatGPT")
    const toolList = [...tools]
      .sort((a, b) => b.name.length - a.name.length)
      .map((t) => ({ name: t.name, slug: t.slug }));

    const linkedSlugs = new Set<string>();
    const MAX_LINKS_PER_ARTICLE = 8;

    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Skip nodes inside links, code, pre, headings
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const skipTags = ["A", "CODE", "PRE", "H1", "H2", "H3", "H4", "H5", "H6"];
        let el: HTMLElement | null = parent;
        while (el && el !== article) {
          if (skipTags.includes(el.tagName)) return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) textNodes.push(n as Text);

    for (const textNode of textNodes) {
      if (linkedSlugs.size >= MAX_LINKS_PER_ARTICLE) break;
      const text = textNode.textContent ?? "";

      for (const tool of toolList) {
        if (linkedSlugs.has(tool.slug)) continue;
        // Word-boundary match, case-insensitive, first occurrence only
        const escaped = tool.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(^|[\\s\\W])(${escaped})(?=[\\s\\W]|$)`, "i");
        const match = text.match(re);
        if (!match) continue;

        const idx = (match.index ?? 0) + match[1].length;
        const before = text.slice(0, idx);
        const hit = text.slice(idx, idx + tool.name.length);
        const after = text.slice(idx + tool.name.length);

        const parent = textNode.parentNode;
        if (!parent) continue;

        const link = document.createElement("a");
        link.href = `/tools/${tool.slug}`;
        link.className =
          "text-accent-light font-medium underline decoration-accent/30 underline-offset-2 hover:decoration-accent";
        link.setAttribute("data-auto-link", "true");
        link.textContent = hit;

        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(link);
        if (after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, textNode);

        linkedSlugs.add(tool.slug);
        break; // move to next text node
      }
    }
  }, []);

  return null;
}
