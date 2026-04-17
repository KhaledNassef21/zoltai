interface AffiliateCTAProps {
  toolName: string;
  description?: string;
  ctaText?: string;
  ctaUrl: string;
  variant?: "default" | "compact" | "banner";
  badge?: string;
}

export function AffiliateCTA({
  toolName,
  description,
  ctaText = "Try Now — Free",
  ctaUrl,
  variant = "default",
  badge,
}: AffiliateCTAProps) {
  if (variant === "compact") {
    return (
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {ctaText}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </a>
    );
  }

  if (variant === "banner") {
    return (
      <div className="my-8 p-6 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card-bg to-cyan-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {badge && (
              <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent-light font-medium mb-2">
                {badge}
              </span>
            )}
            <h4 className="font-bold text-lg text-white">{toolName}</h4>
            {description && (
              <p className="text-sm text-zinc-400 mt-1 max-w-md">
                {description}
              </p>
            )}
            {/* Micro trust signals under the description — low-commitment reassurance */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> Free trial
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> No credit card
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> Cancel anytime
              </span>
            </div>
          </div>
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-accent/20 whitespace-nowrap"
          >
            {ctaText}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="my-8 p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {badge && (
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent-light font-medium mb-2">
              {badge}
            </span>
          )}
          <h4 className="font-semibold text-lg text-white group-hover:text-accent-light transition-colors">
            {toolName}
          </h4>
          {description && (
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
          )}
        </div>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          {ctaText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
