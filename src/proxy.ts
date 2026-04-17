import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (formerly middleware) — two layers of security:
 *   1. GLOBAL: applies hardened security headers to every response
 *      (CSP, HSTS, X-Frame-Options, permissions policy, etc.)
 *   2. ADMIN: adds CSRF protection + stricter cache rules for /admin + /api/admin
 */

const ALLOWED_ORIGINS = [
  "https://zoltai.org",
  "https://www.zoltai.org",
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Global Content-Security-Policy.
 * Notes:
 *  - 'unsafe-inline' in style-src: required for Tailwind + CSS-in-JS (React style prop)
 *  - 'unsafe-inline' in script-src: required because we use dangerouslySetInnerHTML for JSON-LD
 *  - 'unsafe-eval': Next.js dev mode requires this; tightened in production below
 *  - img-src: allow self + data: + https (tools use CDN-hosted images like pravatar, catbox)
 *  - connect-src: allow APIs we call from the browser
 */
function buildCSP(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://js.stripe.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://api.stripe.com",
      "https://www.google-analytics.com",
      "https://vitals.vercel-insights.com",
    ],
    "frame-src": ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(" ")}` : key
    )
    .join("; ");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV === "development";

  // ============================================================
  // GLOBAL security headers — applied to every response
  // ============================================================
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // HSTS: force HTTPS for 2 years, include subdomains (production only)
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy: layered protection against XSS + injection
  response.headers.set("Content-Security-Policy", buildCSP(isDev));

  // ============================================================
  // ADMIN pages + API: stricter rules
  // ============================================================
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    // Override CSP with tighter admin-only version
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; form-action 'self';"
    );
  }

  // CSRF protection for admin API endpoints
  if (pathname.startsWith("/api/admin") && req.method !== "GET") {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    if (origin) {
      const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin === allowed);
      if (!isAllowed) {
        const isVercelPreview =
          origin.endsWith(".vercel.app") && origin.includes("zoltai");
        if (!isVercelPreview) {
          return NextResponse.json(
            { error: "CSRF: Invalid origin" },
            { status: 403 }
          );
        }
      }
    }

    if (!origin && referer) {
      try {
        const refUrl = new URL(referer);
        const refOrigin = refUrl.origin;
        const isAllowed =
          ALLOWED_ORIGINS.includes(refOrigin) ||
          (refOrigin.endsWith(".vercel.app") && refOrigin.includes("zoltai"));
        if (!isAllowed) {
          return NextResponse.json(
            { error: "CSRF: Invalid referer" },
            { status: 403 }
          );
        }
      } catch {}
    }
  }

  return response;
}

export const config = {
  // Apply to all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except:
     * - api routes that need no middleware
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|icons/|.*\\..*).*)",
  ],
};
