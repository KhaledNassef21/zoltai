import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tools",
  description: "Curated collection of the best AI tools for productivity.",
};

const tools = [
  {
    name: "ChatGPT",
    category: "Chatbot",
    description: "OpenAI's conversational AI for writing, coding, and more.",
    url: "https://chat.openai.com",
  },
  {
    name: "Claude",
    category: "Chatbot",
    description: "Anthropic's AI assistant for analysis, writing, and coding.",
    url: "https://claude.ai",
  },
  {
    name: "Midjourney",
    category: "Image Generation",
    description: "AI art generator creating stunning visuals from text prompts.",
    url: "https://midjourney.com",
  },
  {
    name: "Notion AI",
    category: "Productivity",
    description: "AI-powered workspace for notes, docs, and project management.",
    url: "https://notion.so",
  },
  {
    name: "Cursor",
    category: "Coding",
    description: "AI-first code editor that helps you write code faster.",
    url: "https://cursor.sh",
  },
  {
    name: "Perplexity",
    category: "Research",
    description: "AI-powered search engine with real-time web access.",
    url: "https://perplexity.ai",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">AI Tools</span>
        </h1>
        <p className="mt-3 text-zinc-400 text-lg">
          Curated collection of the best AI tools to boost your productivity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <a
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all"
          >
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light">
              {tool.category}
            </span>
            <h3 className="mt-3 font-semibold text-lg group-hover:text-accent-light transition-colors">
              {tool.name}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
