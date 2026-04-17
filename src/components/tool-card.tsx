export interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  useCase: string;
  pricing: "Free" | "Freemium" | "Paid" | "Free Trial";
  pricingDetail?: string;
  url: string;
  affiliateUrl?: string;
  featured?: boolean;
  rating?: number;
}

interface ToolCardProps {
  tool: Tool;
}

const pricingColors: Record<string, string> = {
  Free: "bg-emerald-500/15 text-emerald-400",
  Freemium: "bg-blue-500/15 text-blue-400",
  Paid: "bg-amber-500/15 text-amber-400",
  "Free Trial": "bg-purple-500/15 text-purple-400",
};

export function ToolCard({ tool }: ToolCardProps) {
  const ctaUrl = tool.affiliateUrl || tool.url;
  const ctaText = tool.pricing === "Free" ? "Try Free" : tool.pricing === "Free Trial" ? "Start Free Trial" : "Try Now";

  return (
    <div
      className={`relative flex flex-col p-6 rounded-xl border bg-card-bg transition-all hover:scale-[1.01] ${
        tool.featured
          ? "border-accent/50 shadow-lg shadow-accent/10"
          : "border-card-border hover:border-accent/30"
      }`}
    >
      {tool.featured && (
        <div className="absolute -top-3 left-4">
          <span className="text-xs px-3 py-1 rounded-full bg-accent text-white font-semibold shadow-md">
            Featured
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light"
          >
            {tool.category}
          </span>
          <h3 className="mt-2 font-bold text-lg text-white">{tool.name}</h3>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
            pricingColors[tool.pricing] || "bg-zinc-500/15 text-zinc-400"
          }`}
        >
          {tool.pricing}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-500 leading-relaxed mb-2">
        {tool.description}
      </p>

      {/* Use Case */}
      <p className="text-xs text-zinc-600 mb-4">
        <span className="text-zinc-500 font-medium">Best for:</span>{" "}
        {tool.useCase}
      </p>

      {/* Pricing Detail */}
      {tool.pricingDetail && (
        <p className="text-xs text-zinc-600 mb-4">{tool.pricingDetail}</p>
      )}

      {/* Rating */}
      {tool.rating && (
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < tool.rating! ? "text-amber-400" : "text-zinc-700"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-zinc-500 ml-1">{tool.rating}/5</span>
        </div>
      )}

      {/* CTA - pushed to bottom */}
      <div className="mt-auto pt-4">
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
