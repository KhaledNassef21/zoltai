# Zoltai — Complete Project Documentation

> **Version:** 1.0 | **Last Updated:** April 7, 2026
> **Domain:** [zoltai.org](https://zoltai.org) | **GitHub:** KhaledNassef21/zoltai

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Installation & Setup](#3-installation--setup)
4. [Project Structure](#4-project-structure)
5. [Pages & Routes](#5-pages--routes)
6. [Admin Dashboard](#6-admin-dashboard)
7. [Authentication System](#7-authentication-system)
8. [Blog System](#8-blog-system)
9. [AI Tools Directory](#9-ai-tools-directory)
10. [Email & Newsletter](#10-email--newsletter)
11. [Stripe Payments (Premium)](#11-stripe-payments-premium)
12. [Social Media Automation](#12-social-media-automation)
13. [SEO System](#13-seo-system)
14. [Analytics & Tracking](#14-analytics--tracking)
15. [PWA & Push Notifications](#15-pwa--push-notifications)
16. [GitHub Actions (Automation)](#16-github-actions-automation)
17. [Compliance & Legal](#17-compliance--legal)
18. [Environment Variables](#18-environment-variables)
19. [Deployment (Vercel)](#19-deployment-vercel)
20. [Known Issues & Limitations](#20-known-issues--limitations)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. Project Overview

**Zoltai** is a full-stack web application for discovering and reviewing AI tools. The site generates revenue through:

- **Affiliate links** — Commissions from recommended AI tool signups
- **Premium membership** ($19/month via Stripe) — Exclusive guides and templates
- **Newsletter** — Free lead magnet driving traffic to tools

**Key Value Proposition:** "Discover the best AI tools to boost productivity. No coding required."

The entire content pipeline is automated: article generation (Claude AI), image creation, social media posting (Instagram, Facebook, Reddit), and email drip campaigns — all running via GitHub Actions on a daily schedule.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.1 (App Router + Turbopack) |
| **Styling** | Tailwind CSS v4 (CSS custom properties) |
| **Language** | TypeScript |
| **Blog** | MDX (gray-matter + next-mdx-remote/rsc) |
| **Email** | Resend API |
| **Payments** | Stripe (Checkout + Webhooks) |
| **AI** | Anthropic Claude API (article generation) |
| **Hosting** | Vercel (automatic deploys from GitHub) |
| **DNS** | Namecheap domain → Vercel DNS |
| **Social** | Instagram Graph API, Facebook Page API, Reddit API |
| **CI/CD** | GitHub Actions (7 automated workflows) |

### Key Packages

```
next@16.2.1          - Core framework
tailwindcss@4        - Styling
next-mdx-remote      - MDX rendering
gray-matter           - Frontmatter parsing
reading-time          - Article read time
resend                - Email delivery
stripe@22             - Payment processing
@anthropic-ai/sdk     - Claude AI for content
sharp                 - Image processing
lucide-react          - Icons
recharts              - Admin analytics charts
date-fns              - Date formatting
```

---

## 3. Installation & Setup

### Prerequisites

- Node.js 20+ (recommended: 22.x)
- npm 10+
- Git
- A Vercel account (for deployment)
- A GitHub account (for CI/CD automation)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/KhaledNassef21/zoltai.git
cd zoltai

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys (see Section 18)

# 4. Create data directories
mkdir -p data

# 5. Run development server
npm run dev
# Opens at http://localhost:3000

# 6. Build for production
npm run build

# 7. Start production server
npm start
```

### Quick Start (Minimum Required)

For a basic working site, you only need:

```env
ADMIN_PASSWORD=your_secure_admin_password
```

Everything else is optional and enables specific features (email, payments, social media, etc.).

---

## 4. Project Structure

```
zoltai/
├── .github/workflows/     # 7 automated GitHub Actions
├── data/                  # Runtime data (users, comments, analytics)
│   ├── users.json         # User accounts
│   ├── comments/          # Blog comments (per slug)
│   ├── analytics.json     # Event tracking data
│   ├── posted-slugs.json  # Instagram duplicate prevention
│   └── reddit-posted.json # Reddit duplicate prevention
├── public/                # Static assets
│   ├── icons/             # PWA icons (192x192, 512x512)
│   ├── images/            # Blog covers, Instagram slides
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── scripts/               # Automation scripts (run via GitHub Actions)
│   ├── generate-article.ts    # Claude AI article generator
│   ├── post-instagram.ts      # Instagram + Facebook posting
│   ├── post-reddit.ts         # Reddit posting
│   ├── email-drip.ts          # 7-email drip campaign
│   ├── generate-reels.ts      # Reel script generator
│   ├── seo-optimize.ts        # SEO meta optimization
│   └── weekly-report.ts       # Email analytics report
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Root layout (header, footer, global components)
│   │   ├── home-content.tsx   # Homepage client component
│   │   ├── blog/              # Blog listing + [slug] article pages
│   │   ├── tools/             # AI tools directory
│   │   ├── earn/              # Top 10 tools (affiliate focus)
│   │   ├── premium/           # Premium membership page
│   │   ├── login/             # User login
│   │   ├── register/          # User registration
│   │   ├── profile/           # User dashboard
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact form
│   │   ├── privacy/           # Privacy policy
│   │   ├── terms/             # Terms of service
│   │   ├── admin/             # Admin dashboard (9 pages)
│   │   │   ├── page.tsx       # Dashboard overview
│   │   │   ├── login/         # Admin login
│   │   │   ├── articles/      # Article management
│   │   │   ├── tools/         # Tools CRUD
│   │   │   ├── comments/      # Comment moderation
│   │   │   ├── earn/          # Featured tools management
│   │   │   ├── images/        # Image library
│   │   │   ├── analytics/     # Stats view
│   │   │   ├── settings/      # API key management
│   │   │   └── reels/         # Reel scripts viewer
│   │   └── api/               # API routes
│   │       ├── auth/          # User auth (register, login, logout)
│   │       ├── admin/         # Admin APIs (login, verify, articles, tools, etc.)
│   │       ├── comments/      # Public comments API
│   │       ├── newsletter/    # Newsletter signup
│   │       ├── analytics/     # Event tracking
│   │       └── stripe/        # Stripe checkout + webhook
│   ├── components/        # Reusable UI components
│   │   ├── header.tsx         # Site header + navigation
│   │   ├── footer.tsx         # Site footer + legal links
│   │   ├── providers.tsx      # Language provider (EN/AR)
│   │   ├── disclaimer.tsx     # Legal disclaimers (3 variants)
│   │   ├── cookie-consent.tsx # GDPR cookie banner
│   │   ├── breadcrumbs.tsx    # Breadcrumbs + JSON-LD schema
│   │   ├── faq-schema.tsx     # FAQ schema auto-extraction
│   │   ├── social-proof.tsx   # Stats counter + testimonials
│   │   ├── blog-card.tsx      # Blog post card
│   │   ├── tool-card.tsx      # Tool card component
│   │   ├── tag-links.tsx      # Clickable tag pills
│   │   ├── affiliate-cta.tsx  # Affiliate CTA banners
│   │   ├── article-cta.tsx    # Mid/bottom article CTAs
│   │   ├── lead-magnet.tsx    # Email capture component
│   │   ├── newsletter-signup.tsx  # Newsletter form
│   │   ├── newsletter-popup.tsx   # Timed popup
│   │   ├── sticky-cta.tsx     # Floating CTA button
│   │   ├── ab-test-cta.tsx    # A/B test CTAs
│   │   ├── comments.tsx       # Blog comments system
│   │   ├── pwa-register.tsx   # PWA service worker registration
│   │   ├── push-prompt.tsx    # Push notification prompt
│   │   ├── heatmap-tracker.tsx # Click heatmap tracking
│   │   └── admin/
│   │       └── sidebar.tsx    # Admin sidebar navigation
│   ├── content/blog/      # MDX blog articles (13 articles)
│   ├── data/
│   │   └── tools.ts       # AI tools database (24+ tools)
│   └── lib/               # Utility libraries
│       ├── blog.ts            # Blog post reading/parsing
│       ├── stripe.ts          # Stripe SDK initialization
│       ├── admin-auth.ts      # Admin authentication
│       ├── github.ts          # GitHub API (file operations)
│       ├── claude.ts          # Claude AI article generation
│       ├── tracking.ts        # Funnel & analytics tracking
│       └── image-prompts.ts   # Image generation prompts
└── package.json
```

---

## 5. Pages & Routes

### Public Pages

| Route | Description |
|-------|------------|
| `/` | Homepage — hero, features, featured tools, latest posts, testimonials, newsletter |
| `/blog` | Blog listing with tag-based filtering |
| `/blog/[slug]` | Individual article — full 6-position lead flow, related articles, comments |
| `/tools` | AI tools directory — filterable by category, search |
| `/earn` | Top 10 AI tools — curated affiliate picks |
| `/premium` | Premium membership — features, comparison table, Stripe checkout |
| `/about` | About Zoltai page |
| `/contact` | Contact form |
| `/privacy` | Privacy policy (11 sections) |
| `/terms` | Terms of service (13 sections) |
| `/login` | User login |
| `/register` | User registration |
| `/profile` | User dashboard (requires login) |

### API Routes

| Route | Method | Description |
|-------|--------|------------|
| `/api/auth` | GET | Get current user session |
| `/api/auth` | POST | Register / Login / Logout |
| `/api/comments` | GET/POST | Public comments per blog post |
| `/api/newsletter` | POST | Newsletter signup (Resend) |
| `/api/analytics/track` | POST | Event tracking |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe payment events |
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/verify` | GET | Verify admin session |
| `/api/admin/articles` | GET/POST/PUT/DELETE | Article CRUD |
| `/api/admin/tools` | GET/POST/PUT/DELETE | Tools CRUD |
| `/api/admin/comments` | GET/PUT/DELETE | Comment moderation |
| `/api/admin/images` | GET | Image library listing |
| `/api/admin/reels` | GET/POST | Reel scripts |
| `/api/admin/publish` | POST | Trigger GitHub Actions workflows |
| `/api/admin/settings` | GET/POST | API key management |

---

## 6. Admin Dashboard

**Access:** Navigate to `/admin/login` and enter the `ADMIN_PASSWORD`.

### Admin Pages

| Page | URL | Features |
|------|-----|----------|
| **Dashboard** | `/admin` | Stats cards, quick action buttons (trigger workflows), external tool links |
| **Articles** | `/admin/articles` | Create/edit/delete blog articles, search, markdown editor |
| **Tools** | `/admin/tools` | Add/edit/delete AI tools, search by category, modal form |
| **Comments** | `/admin/comments` | Approve/reject/delete comments, filter tabs (pending/approved/rejected) |
| **Earn** | `/admin/earn` | Toggle featured tools, see ranking order |
| **Images** | `/admin/images` | Grid view of all uploaded images, copy URL button |
| **Analytics** | `/admin/analytics` | Stats overview, links to Vercel Analytics and GSC |
| **Settings** | `/admin/settings` | View/update API keys (masked display) |
| **Reels** | `/admin/reels` | View generated reel scripts per article, copy to clipboard |

### Admin Security

- Rate-limited: 5 login attempts per 15 minutes, 30-minute lockout
- Cryptographically secure session tokens (crypto.randomBytes)
- 24-hour session expiry
- No default password — `ADMIN_PASSWORD` env var required
- Timing-safe password comparison

---

## 7. Authentication System

### User Auth

- **Password Hashing:** scrypt (Node.js built-in, memory-hard)
- **Session Tokens:** 48-byte cryptographically random hex strings
- **Session Storage:** In-memory Map with 30-day expiry
- **Rate Limiting:** 10 attempts per 15 minutes per IP
- **Password Requirements:** Min 8 chars, uppercase, lowercase, number
- **Email Validation:** Format check + length limit (254 chars)
- **Legacy Support:** Auto-upgrades old SHA256 hashes on login

### Cookie Settings

```
httpOnly: true
secure: true (production only)
sameSite: "lax" (user) / "strict" (admin)
maxAge: 30 days (user) / 24 hours (admin)
path: "/"
```

### Important Note

Sessions are stored in-memory and will be lost on server restart. On Vercel (serverless), this means sessions may not persist between different serverless function invocations. For production at scale, consider migrating to Redis or a database.

---

## 8. Blog System

### How Articles Work

1. Articles are stored as `.mdx` files in `src/content/blog/`
2. Each article has frontmatter (title, description, date, tags, image, keywords)
3. Articles are parsed by `src/lib/blog.ts` using gray-matter
4. Rendered with `next-mdx-remote/rsc` on the server
5. Static generation via `generateStaticParams()`

### Article Lead Flow (6 Positions)

Each blog post has 6 conversion touchpoints:

1. **Top Affiliate CTA** — Banner for the most relevant tool
2. **Newsletter Bar** — Free guide signup
3. **Mid-Article CTA** — "Try [Tool] Free" after content
4. **Tool Recommendations** — 3 relevant tools with affiliate links
5. **Bottom CTA** — Final conversion prompt
6. **Newsletter Popup** — Timed (45s) + exit intent

### Creating a New Article

**Option A: Admin Dashboard**
1. Go to `/admin/articles` → "New Article"
2. Fill in title, content (MDX), tags
3. Click Save → Creates `.mdx` file via GitHub API

**Option B: Automated (Claude AI)**
1. GitHub Action `daily-article.yml` runs at 6AM UTC
2. Script `scripts/generate-article.ts` uses Claude to write an article
3. Auto-commits to repo → triggers Vercel redeploy

**Option C: Manual**
1. Create a new `.mdx` file in `src/content/blog/`
2. Add required frontmatter:

```yaml
---
title: 'Your Article Title'
description: 'SEO description'
date: '2026-04-07'
author: 'Zoltai AI'
tags:
  - AI Tools
  - Productivity
image: /images/default-cover.jpg
---
```

---

## 9. AI Tools Directory

### Data Source

Tools are defined in `src/data/tools.ts`. Each tool has:

```typescript
{
  name: "ChatGPT Plus",
  slug: "chatgpt",
  description: "...",
  category: "AI Chatbot",        // One of: AI Writing, AI Image, AI Chatbot, AI Coding, SEO, Productivity, Hosting, Research
  useCase: "...",
  pricing: "Freemium",           // Free, Freemium, Paid, Free Trial
  pricingDetail: "Free tier available. Plus plan $20/month.",
  url: "https://chat.openai.com",
  affiliateUrl: "https://chat.openai.com/?ref=zoltai",
  featured: true,                // Shows on /earn page
  rating: 5,                     // 1-5 stars
}
```

### Managing Tools

- **Admin:** `/admin/tools` — Full CRUD via modal form
- **API:** `POST/PUT/DELETE /api/admin/tools`
- **Direct:** Edit `src/data/tools.ts` and commit

Currently: **24+ tools** across 8 categories.

---

## 10. Email & Newsletter

### Provider: Resend

- **Sending domain:** noreply@zoltai.org
- **Contact email:** info.zoltai@gmail.com
- **Free tier:** 3,000 emails/month

### Newsletter Flow

1. User enters email on any signup form
2. `POST /api/newsletter` → Adds to Resend audience
3. Sends welcome email: "Your AI Tools Journey Starts Here"
4. 7-email drip campaign over 14 days (automated via GitHub Actions)

### Drip Campaign Schedule

| Day | Subject |
|-----|---------|
| 1 | Getting started with AI tools — a practical 2-hour guide |
| 3 | The AI writing playbook: tools and workflows |
| 5 | How creators are using AI art tools |
| 7 | I tested 24 AI tools. These 5 stood out. |
| 10 | The AI coding opportunity nobody talks about |
| 12 | These free AI tiers are worth exploring now |
| 14 | Your AI learning roadmap (save this email) |

### Required Environment Variables

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@zoltai.org
RESEND_AUDIENCE_ID=...
```

---

## 11. Stripe Payments (Premium)

### Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create a Product: "Zoltai Premium" → Monthly price $19
3. Set environment variables:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Create a webhook endpoint in Stripe Dashboard:
   - URL: `https://zoltai.org/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### Payment Flow

1. User clicks "Subscribe Now" on `/premium`
2. `POST /api/stripe/checkout` creates a Checkout Session
3. User redirected to Stripe Checkout
4. On success: Stripe sends webhook → user upgraded to premium
5. On cancel: Stripe sends webhook → user downgraded

### Premium Features

- Advanced AI guides and blueprints
- Done-for-you templates
- Monthly performance reports
- Priority support
- Early access to new tools

---

## 12. Social Media Automation

### Instagram + Facebook

**Script:** `scripts/post-instagram.ts`
**Schedule:** Daily at 12PM UTC

Flow:
1. Selects latest unposted article
2. Uploads 4 carousel images to Instagram Graph API
3. Cross-posts to Facebook Page (multi-photo)
4. Tracks posted slugs to prevent duplicates

**Required:**
```
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
FACEBOOK_PAGE_ID=...
FACEBOOK_PAGE_ACCESS_TOKEN=...
```

### Reddit

**Script:** `scripts/post-reddit.ts`
**Schedule:** Daily at 2PM UTC

Flow:
1. Selects unposted articles matching subreddit topics
2. Posts to relevant subreddits (max 2 per run, 2-min rate limit)
3. Tag-to-subreddit mapping: ai-coding → r/programming, r/webdev, etc.

**Required:**
```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
```

### Reels Content

**Script:** `scripts/generate-reels.ts`
**Schedule:** Daily at 7AM UTC

Generates 10 reel scripts per article in formats:
Hook, Tool Demo, Step-by-Step, Before/After, Value Breakdown, Comparison, Quick Tip, Myth Buster, Story, List/Ranking

View generated reels at `/admin/reels`.

---

## 13. SEO System

### Implemented SEO Features

| Feature | Implementation |
|---------|---------------|
| **JSON-LD Schema** | WebSite, Article, FAQPage, BreadcrumbList, Organization |
| **Meta Tags** | Title, description, keywords, OG, Twitter cards on every page |
| **Sitemap** | Auto-generated at `/sitemap.xml` |
| **Robots.txt** | At `/robots.txt` |
| **Breadcrumbs** | On 8 pages with BreadcrumbList schema |
| **FAQ Schema** | Auto-extracted from blog headings (questions → FAQPage) |
| **Canonical URLs** | Set on all pages |
| **Internal Linking** | Tag-based navigation, related articles, tool recommendations |
| **Google Search Console** | Verified (meta tag in layout) |

### SEO Automation

**Script:** `scripts/seo-optimize.ts`
**Schedule:** Daily at 3AM UTC

Auto-optimizes article meta descriptions, titles, and keywords using Claude AI.

---

## 14. Analytics & Tracking

### Event Tracking

Events are tracked via `POST /api/analytics/track` and stored in `data/analytics.json`.

Tracked events:
- `page_view` — Page visits
- `cta_click` — CTA button clicks
- `affiliate_click` — Affiliate link clicks
- `newsletter_signup` — Email signups
- `popup_shown` — Newsletter popup impressions
- `cta_impression` — A/B test CTA impressions

### A/B Testing

3 CTA variants tested with localStorage persistence:
- Variant A: "Explore AI Tools"
- Variant B: "Discover Top AI Tools"
- Variant C: "Boost Your Workflow with AI"

Tracks impressions and clicks per variant via analytics API.

### Funnel Tracking

`src/lib/tracking.ts` provides:
- `trackFunnel()` — Track funnel events
- `buildAffiliateUrl()` — Add UTM params to affiliate URLs
- `getFunnelStats()` — Get conversion metrics

---

## 15. PWA & Push Notifications

### PWA

- `public/manifest.json` — App manifest
- `public/sw.js` — Service worker (network-first + cache fallback)
- Icons: 192x192 + 512x512 (purple Z logo)
- Installable on mobile devices

### Push Notifications

- Prompt shown after 30 seconds on site
- Uses service worker Push API
- Sends notifications about new articles and tools

---

## 16. GitHub Actions (Automation)

7 automated workflows running on schedule:

| Workflow | File | Schedule | Description |
|----------|------|----------|-------------|
| **SEO Optimizer** | `seo-optimize.yml` | Daily 3AM UTC | Auto-optimize article meta |
| **Article Generator** | `daily-article.yml` | Daily 6AM UTC | Claude AI writes new article |
| **Email Drip** | `email-drip.yml` | Daily 8AM UTC | Send drip campaign emails |
| **Instagram+FB** | `daily-instagram.yml` | Daily 12PM UTC | Post to social media |
| **Reddit** | `daily-reddit.yml` | Daily 2PM UTC | Post to subreddits |
| **Reels Generator** | `generate-reels.yml` | Daily 7AM UTC | Generate reel scripts |
| **Weekly Report** | `weekly-report.yml` | Sunday | Email analytics summary |

All workflows can also be triggered manually from the admin dashboard (`/admin` → Quick Actions).

---

## 17. Compliance & Legal

### Ad Platform Compliance

The project has been fully audited for Facebook/Google ad policy compliance:

- **No income claims** — All "make money" language removed
- **No earning promises** — Focus on "learn, discover, boost productivity"
- **Disclaimers** — 3-variant component (full, inline, affiliate)
- **Affiliate disclosure** — Clear disclosure on all affiliate pages
- **Educational framing** — All content positioned as educational

### Legal Pages

- **Privacy Policy** (`/privacy`) — 11 sections covering data collection, cookies, third-party services
- **Terms of Service** (`/terms`) — 13 sections covering usage rules, liability, IP
- **Cookie Consent** — GDPR-compliant banner with accept/decline
- **Footer Links** — Direct links to Privacy and Terms

---

## 18. Environment Variables

### Required (Core)

```env
ADMIN_PASSWORD=your_secure_password    # Admin dashboard access
```

### Email (Resend)

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@zoltai.org
RESEND_AUDIENCE_ID=...
REPORT_EMAIL_TO=info.zoltai@gmail.com
```

### Payments (Stripe)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Social Media

```env
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
FACEBOOK_PAGE_ID=1049370878260065
FACEBOOK_PAGE_ACCESS_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
```

### AI & GitHub

```env
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...
GITHUB_REPO=KhaledNassef21/zoltai
GITHUB_BRANCH=main
```

### Optional

```env
IMAGE_PROVIDER=sharp           # Image generation method
```

---

## 19. Deployment (Vercel)

### Initial Setup

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Select the `KhaledNassef21/zoltai` repository
4. Add all environment variables in Vercel Settings → Environment Variables
5. Deploy

### DNS Setup (Namecheap → Vercel)

1. In Vercel: Add domain `zoltai.org`
2. In Namecheap: Set nameservers to Vercel's NS records
3. Wait for propagation (up to 48 hours)

### Automatic Deployments

Every push to `main` triggers a new Vercel deployment automatically.
GitHub Actions that commit to the repo (article generation, SEO, etc.) also trigger redeployments.

### Important: Vercel is Read-Only

Vercel's filesystem is read-only. File writes (articles, tools, comments) use the GitHub API as a fallback:
- `src/lib/github.ts` handles all file operations
- Requires `GITHUB_TOKEN` environment variable
- Creates commits for each change

---

## 20. Known Issues & Limitations

### Current Limitations

1. **Session Persistence:** User sessions are stored in-memory. On Vercel (serverless), sessions may not persist across different function invocations. For production scale, migrate to Redis or a database.

2. **Premium Content Gating:** The premium page lists locked articles, but the actual content gating system is not yet implemented. Premium articles need to be created and access-controlled.

3. **Admin Settings Persistence:** Runtime env var updates via `/admin/settings` don't persist on Vercel. They reset on each deployment.

4. **Comment Spam:** Basic keyword-based spam filter. Consider adding CAPTCHA for production.

5. **Single Admin:** Only one admin password. No role-based access or multiple admin accounts.

6. **No Email Verification:** User registration doesn't require email verification.

7. **Social Token Expiry:** Instagram/Facebook tokens may expire. Monitor and refresh periodically.

### Data Storage

All data is stored in flat JSON files (`data/` directory). For high-traffic production, consider migrating to a database (PostgreSQL, MongoDB, etc.).

---

## 21. Troubleshooting

### Common Issues

**Build fails with "STRIPE_SECRET_KEY is not set"**
- This is just a warning. The Stripe module uses lazy initialization and won't error at build time.

**Git push rejected (remote has new commits)**
- GitHub Actions (analytics tracking) may push between your commits
- Fix: `git pull --rebase origin main` then push again

**Admin login says "Admin login is not configured"**
- Set the `ADMIN_PASSWORD` environment variable in `.env.local` or Vercel

**Users can't stay logged in on Vercel**
- Known limitation: in-memory sessions reset between serverless invocations
- Workaround: Users may need to log in again periodically

**Instagram posting fails**
- Check if `INSTAGRAM_ACCESS_TOKEN` has expired
- Regenerate from Facebook Developer Console
- Token should be a long-lived (60-day) or never-expiring page token

**Articles not showing**
- Verify `.mdx` files exist in `src/content/blog/`
- Check frontmatter format (YAML between `---` markers)
- Run `npm run build` to check for parsing errors

---

## Contact

- **Email:** info.zoltai@gmail.com
- **Website:** [zoltai.org](https://zoltai.org)
- **Instagram:** [@zoltai.ai](https://www.instagram.com/zoltai.ai/)
- **Facebook:** [Zoltai Community](https://www.facebook.com/zoltai.community)
