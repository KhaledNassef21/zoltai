"use client";

import { useEffect, useState } from "react";
import { trackFunnel } from "@/lib/tracking";

/**
 * Mid-Article CTA — appears between paragraphs in blog posts.
 * High-converting inline banner that matches the article topic.
 */
export function MidArticleCTA({
  toolName,
  toolUrl,
  slug,
}: {
  toolName: string;
  toolUrl: string;
  slug: string;
}) {
  useEffect(() => {
    trackFunnel({
      event: "cta_impression",
      source: "article_mid",
      tool: toolName,
      article: slug,
    });
  }, [toolName, slug]);

  return (
    <div className="my-10 p-6 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card-bg to-cyan-500/10 relative overflow-hidden not-prose">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-full blur-xl" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-accent-light font-semibold uppercase tracking-wider mb-1">
            Recommended Tool
          </p>
          <p className="text-foreground font-semibold">
            Want to start earning? Try {toolName} — most readers start here.
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            Free to start. No credit card needed.
          </p>
        </div>
        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={() =>
            trackFunnel({
              event: "affiliate_click",
              source: "article_mid",
              tool: toolName,
              article: slug,
            })
          }
          className="shrink-0 px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-accent/20 whitespace-nowrap"
        >
          Try {toolName} Free →
        </a>
      </div>
    </div>
  );
}

/**
 * Bottom Article CTA — strong call-to-action after the article content.
 */
export function BottomArticleCTA({
  slug,
}: {
  slug: string;
}) {
  return (
    <div className="my-10 p-8 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card-bg to-cyan-500/5 text-center not-prose">
      <p className="text-3xl mb-3">💰</p>
      <h3 className="text-xl font-bold mb-2">
        Ready to Start Earning with AI?
      </h3>
      <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
        Join thousands of people using AI tools to build side income. See our
        top-rated tools with step-by-step guides.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/earn"
          onClick={() =>
            trackFunnel({
              event: "cta_click",
              source: "article_bottom",
              article: slug,
            })
          }
          className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-accent/20"
        >
          🔥 See Top Earning Tools
        </a>
        <a
          href="/tools"
          onClick={() =>
            trackFunnel({
              event: "cta_click",
              source: "article_bottom_tools",
              article: slug,
            })
          }
          className="px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:text-foreground hover:border-accent/30 font-medium text-sm transition-all"
        >
          Browse All 21+ Tools →
        </a>
      </div>
    </div>
  );
}
