import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for admin security:
 * - CSRF protection: reject non-GET requests to /api/admin/* without valid origin
 * - Security headers for admin pages
 * - Rate limiting headers
 */

const ALLOWED_ORIGINS = [
  "https://zoltai.org",
  "https://www.zoltai.org",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // === Admin pages security headers ===
  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; form-action 'self';"
    );
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  // === CSRF protection for admin API endpoints ===
  if (pathname.startsWith("/api/admin") && req.method !== "GET") {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    // Allow requests with no origin (e.g., server-side, cURL for testing)
    // but block requests from wrong origins
    if (origin) {
      const isAllowed = ALLOWED_ORIGINS.some(
        (allowed) => origin === allowed
      );
      if (!isAllowed) {
        // Also check if it's a Vercel preview deployment
        const isVercelPreview =
          origin.endsWith(".vercel.app") &&
          origin.includes("zoltai");
        if (!isVercelPreview) {
          return NextResponse.json(
            { error: "CSRF: Invalid origin" },
            { status: 403 }
          );
        }
      }
    }

    // If no origin but has referer, check referer
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
