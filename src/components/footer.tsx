"use client";

import Link from "next/link";
import { useLang } from "./providers";

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-card-border py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg gradient-text mb-3">Zoltai</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-300 mb-3">
              {t("footer.links")}
            </h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <Link href="/blog" className="hover:text-foreground transition-colors">
                {t("nav.blog")}
              </Link>
              <Link href="/tools" className="hover:text-foreground transition-colors">
                {t("nav.tools")}
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                {t("nav.about")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-300 mb-3">
              {t("footer.community")}
            </h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <a
                href="https://t.me/zoltai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://discord.gg/zoltai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-300 mb-3">
              {t("footer.follow")}
            </h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <a
                href="https://instagram.com/zoltai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://twitter.com/zoltai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Twitter/X
              </a>
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
