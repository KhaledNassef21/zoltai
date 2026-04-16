"use client";

import { useState } from "react";
import { useLang } from "./providers";

interface FAQItem {
  q: string;
  a: string;
}

/**
 * FAQ Accordion — animated open/close, single-open mode.
 * Emits JSON-LD FAQ schema for SEO.
 */
export function FAQAccordion() {
  const { t, dir } = useLang();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div>
      {/* SEO: JSON-LD FAQ schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="text-center mb-10">
        <span className="inline-block text-xs font-bold tracking-widest text-accent-light uppercase mb-3">
          {t("faq.badge")}
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          {t("faq.title")}
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">{t("faq.desc")}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((item, i) => {
          const open = openIdx === i;
          return (
            <div
              key={i}
              className={`rounded-xl border transition-all overflow-hidden ${
                open
                  ? "border-accent/40 bg-card-bg"
                  : "border-card-border bg-card-bg/40 hover:bg-card-bg/70"
              }`}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                className={`w-full flex items-center justify-between gap-4 p-5 ${
                  dir === "rtl" ? "text-right" : "text-left"
                }`}
              >
                <span className="font-semibold text-zinc-100 text-base sm:text-lg">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    open
                      ? "bg-accent border-accent text-white rotate-45"
                      : "border-card-border text-zinc-400"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-zinc-300 leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
