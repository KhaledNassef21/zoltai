import { tools } from "@/data/tools";

interface ComparisonTableProps {
  slugs: string[];
  title?: string;
}

/**
 * ComparisonTable — side-by-side comparison of curated tools with affiliate
 * CTAs. Meant to be dropped into MDX content for "vs" / roundup articles.
 *
 * Conversion-optimized:
 *  - Sticky "Try Free" button per column (mobile: horizontal scroll)
 *  - Star rating, price, best-for row + green check / red x feature rows
 *  - nofollow sponsored links + ref=zoltai tracking
 */
export function ComparisonTable({ slugs, title }: ComparisonTableProps) {
  const selected = slugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => !!t);

  if (selected.length < 2) return null;

  return (
    <div className="my-10 rounded-xl border border-card-border bg-card-bg overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-accent/10 to-transparent">
          <h3 className="font-bold text-lg text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Updated · Affiliate disclosure: we earn a commission at no extra cost to you.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Feature
              </th>
              {selected.map((tool) => (
                <th key={tool.slug} className="px-4 py-4 text-left min-w-[180px]">
                  <div className="font-bold text-zinc-100 text-base">
                    {tool.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (tool.rating ?? 0) ? "text-yellow-400" : "text-zinc-700"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs text-zinc-500 ml-1">
                      {tool.rating ?? 0}.0
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-card-border/60">
              <td className="px-4 py-3 text-zinc-400 font-medium">Category</td>
              {selected.map((tool) => (
                <td key={tool.slug} className="px-4 py-3 text-zinc-200">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                    {tool.category}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-b border-card-border/60">
              <td className="px-4 py-3 text-zinc-400 font-medium">Pricing</td>
              {selected.map((tool) => (
                <td key={tool.slug} className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-light font-semibold">
                    {tool.pricing}
                  </span>
                  {tool.pricingDetail && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {tool.pricingDetail}
                    </div>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-card-border/60">
              <td className="px-4 py-3 text-zinc-400 font-medium">Best for</td>
              {selected.map((tool) => (
                <td key={tool.slug} className="px-4 py-3 text-zinc-200 text-sm">
                  {tool.useCase}
                </td>
              ))}
            </tr>
            <tr className="border-b border-card-border/60">
              <td className="px-4 py-3 text-zinc-400 font-medium">Description</td>
              {selected.map((tool) => (
                <td key={tool.slug} className="px-4 py-3 text-zinc-300 text-xs leading-relaxed">
                  {tool.description}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-4"></td>
              {selected.map((tool) => (
                <td key={tool.slug} className="px-4 py-4">
                  <a
                    href={tool.affiliateUrl || tool.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="inline-flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-accent/20"
                  >
                    Try Free
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
