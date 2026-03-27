import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">
          Zoltai
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/blog"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/tools"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Tools
          </Link>
          <Link
            href="/about"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            About
          </Link>
        </div>
      </nav>
    </header>
  );
}
