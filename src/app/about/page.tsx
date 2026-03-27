import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Zoltai — your daily source for AI tools and productivity insights.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">
        About <span className="gradient-text">Zoltai</span>
      </h1>

      <div className="prose">
        <p>
          Zoltai is your daily source for AI tools, productivity tips, and
          artificial intelligence insights. We publish fresh, research-backed
          content every day to help you stay ahead in the rapidly evolving world
          of AI.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe AI should be accessible to everyone — from beginners taking
          their first steps to professionals looking to optimize their workflows.
          Our goal is to bridge the gap between complex AI technology and
          practical, everyday use.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li>In-depth AI tool reviews and comparisons</li>
          <li>Productivity hacks using artificial intelligence</li>
          <li>Step-by-step tutorials and guides</li>
          <li>Industry trends and breaking AI news</li>
          <li>Workflow automation strategies</li>
        </ul>

        <h2>Powered by AI</h2>
        <p>
          In true AI fashion, our content pipeline is powered by artificial
          intelligence. We use AI to research trending topics, generate initial
          drafts, create cover images, and optimize for SEO — all while
          maintaining quality and accuracy through careful curation.
        </p>
      </div>
    </div>
  );
}
