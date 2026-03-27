import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-card-border py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg gradient-text mb-3">Zoltai</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Your guide to AI tools and productivity. Smart content, daily.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-300 mb-3">Links</h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <Link
                href="/tools"
                className="hover:text-white transition-colors"
              >
                Tools
              </Link>
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-300 mb-3">
              Follow Us
            </h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <span>Instagram: @zoltai</span>
              <span>Twitter/X: @zoltai</span>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-card-border text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Zoltai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
