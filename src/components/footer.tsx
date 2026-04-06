"use client";

import Link from "next/link";
import { useLang } from "./providers";
import { Disclaimer } from "./disclaimer";

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-card-border mt-20">
      <div className="py-12">
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
                  href="https://www.facebook.com/zoltai.community"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/zoltai.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-300 mb-3">
                {t("footer.follow")}
              </h4>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                <a
                  href="mailto:info.zoltai@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  info.zoltai@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimers */}
      <Disclaimer />

      <div className="py-4 border-t border-card-border text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Zoltai. All rights reserved.
      </div>
    </footer>
  );
}
