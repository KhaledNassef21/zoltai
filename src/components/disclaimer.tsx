/**
 * Compliance Disclaimer Component
 *
 * Displays legal disclaimers for affiliate links, income claims,
 * and educational content. Required for Facebook/Google ad compliance.
 *
 * Usage:
 * - <Disclaimer /> — Full disclaimer (footer-style)
 * - <Disclaimer variant="inline" /> — Short inline note
 * - <Disclaimer variant="affiliate" /> — Affiliate-only disclosure
 */

interface DisclaimerProps {
  variant?: "full" | "inline" | "affiliate";
}

export function Disclaimer({ variant = "full" }: DisclaimerProps) {
  if (variant === "inline") {
    return (
      <p className="text-xs text-zinc-600 leading-relaxed">
        <strong className="text-zinc-500">Disclaimer:</strong> Results vary
        based on individual effort, experience, and market conditions. This
        content is for educational purposes only and does not guarantee any
        specific outcomes.
      </p>
    );
  }

  if (variant === "affiliate") {
    return (
      <p className="text-xs text-zinc-600 leading-relaxed">
        <strong className="text-zinc-500">Affiliate Disclosure:</strong> Some
        links on this page are affiliate links. We may earn a commission if you
        sign up through our link, at no extra cost to you. We only recommend
        tools we have personally reviewed and believe provide genuine value.
      </p>
    );
  }

  // Full disclaimer
  return (
    <div className="py-6 px-4 border-t border-card-border">
      <div className="max-w-3xl mx-auto space-y-3">
        <p className="text-xs text-zinc-600 leading-relaxed">
          <strong className="text-zinc-500">Disclaimer:</strong> The
          information provided on Zoltai is for educational and informational
          purposes only. Individual results will vary based on effort,
          experience, skill level, and market conditions. We do not guarantee
          any specific outcomes or results from using the tools or strategies
          discussed on this site.
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          <strong className="text-zinc-500">Affiliate Disclosure:</strong> Some
          links on this site are affiliate links. This means we may earn a
          commission if you make a purchase through our link, at no additional
          cost to you. We only recommend products and services that we have
          personally evaluated and believe provide real value to our readers.
          Our editorial content is not influenced by affiliate partnerships.
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          <strong className="text-zinc-500">No Financial Advice:</strong> Nothing
          on this website constitutes financial, business, or professional
          advice. Always do your own research and consult with qualified
          professionals before making any business or financial decisions.
        </p>
      </div>
    </div>
  );
}
