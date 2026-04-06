/**
 * FAQ Schema Component
 *
 * Generates FAQPage JSON-LD from Q&A pairs.
 * Improves Google rich snippets (FAQ dropdowns in search results).
 *
 * Usage:
 * <FAQSchema faqs={[{ question: "...", answer: "..." }]} />
 */

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQ[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Extract FAQs from markdown content.
 * Looks for Q&A patterns:
 * - "## What is...?" / "## How to...?" etc.
 * - Lines starting with **Q:** or ### followed by a question
 * Then takes the next paragraph as the answer.
 */
export function extractFAQsFromContent(content: string): FAQ[] {
  const faqs: FAQ[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match heading questions: ## What is X? / ### How do I...?
    const headingMatch = line.match(
      /^#{2,3}\s+(.+\?)\s*$/
    );

    if (headingMatch) {
      const question = headingMatch[1].trim();
      // Collect next paragraph as answer (skip empty lines)
      let answer = "";
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine === "") {
          if (answer) break; // End of paragraph
          continue; // Skip leading empty lines
        }
        if (nextLine.startsWith("#")) break; // Next heading
        // Strip markdown formatting for clean schema text
        const cleanLine = nextLine
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/`(.*?)`/g, "$1");
        answer += (answer ? " " : "") + cleanLine;
      }

      if (answer && answer.length > 20) {
        faqs.push({ question, answer });
      }
    }
  }

  return faqs.slice(0, 10); // Max 10 FAQs for schema
}
