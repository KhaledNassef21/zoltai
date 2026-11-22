/**
 * Zoltai Weekly - the weekly newsletter issue for subscribers.
 *
 * Two modes:
 *
 *   npx tsx scripts/weekly-issue.ts --draft   (scheduled, Sundays)
 *     Builds the issue from articles published in the last 7 days
 *     (frontmatter of src/content/blog/*.mdx: title, description, date, image).
 *     Writes data/weekly-issue-draft.json and, when REPORT_EMAIL_TO is set,
 *     emails a preview of the draft to the owner. Never sends to subscribers.
 *
 *   npx tsx scripts/weekly-issue.ts --send    (workflow_dispatch only, after
 *     the owner approves the draft) Sends the committed draft to all active
 *     subscribers via Resend, then records it in data/weekly-issue-log.json
 *     so the same draft can never be sent twice.
 *
 * Content rules (same as the articles and the drip series): no earnings or
 * income claims, no "we tested" claims, no urgency framing, no unverified
 * prices, links go to zoltai.org articles only. Every email carries a signed
 * unsubscribe link and List-Unsubscribe headers.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createHmac } from "crypto";

// Load .env.local for local development
function loadEnv() {
  const envFile = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const SITE = "https://zoltai.org";
const SUBSCRIBERS_FILE = path.join(process.cwd(), "data/subscribers.json");
const DRAFT_FILE = path.join(process.cwd(), "data/weekly-issue-draft.json");
const LOG_FILE = path.join(process.cwd(), "data/weekly-issue-log.json");
const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");
const RESEND_DAILY_LIMIT_GUARD = 95; // Resend free tier: 100 emails/day

interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string;
  emailsSent: number[];
  unsubscribed?: boolean;
}

interface ArticleInfo {
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  quickSummary: string[];
}

interface WeeklyDraft {
  id: string; // YYYY-MM-DD of generation
  generatedAt: string;
  subject: string;
  preheader: string;
  html: string;
  articles: { slug: string; title: string; date: string }[];
}

// ─────────────────────────────────────────────
// Helpers (same conventions as scripts/email-drip.ts)
// ─────────────────────────────────────────────

function unsubToken(email: string): string {
  const secret =
    process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "";
  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

function unsubQuery(email: string): string {
  return `e=${encodeURIComponent(email.trim().toLowerCase())}&t=${unsubToken(
    email
  )}`;
}

// UTM-tracked link builder
function link(p: string, campaign: string): string {
  const params = new URLSearchParams({
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: campaign,
  });
  return `${SITE}${p}?${params.toString()}`;
}

// Shared email wrapper. {{unsubq}} is replaced per recipient at send time.
function wrap(content: string, preheader: string): string {
  const checked = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; border-radius: 12px; overflow: hidden;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0a0a0a;">${preheader}</div>
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 24px 32px;">
    <a href="${SITE}" style="color: white; text-decoration: none; font-size: 20px; font-weight: 700;"><img src="${SITE}/icons/icon-192.png" width="40" height="40" alt="Zoltai" style="vertical-align: middle; border-radius: 8px; border: 0; margin-right: 10px;" /><span style="vertical-align: middle;">Zoltai</span></a>
  </div>
  <div style="padding: 32px;">
    ${content}
    <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">Prices and features were checked when each guide was written. Vendors change them, so check the vendor's pricing page. Generated ${checked}.</p>
  </div>
  <div style="padding: 24px 32px; border-top: 1px solid #1e1e1e;">
    <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0;">
      You are receiving this because you signed up at <a href="${SITE}" style="color: #a78bfa;">zoltai.org</a>.<br/>
      <a href="${SITE}/unsubscribe?{{unsubq}}" style="color: #666;">Unsubscribe</a>
    </p>
    <p style="color: #444; font-size: 11px; margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} Zoltai &middot; zoltai.org</p>
  </div>
</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────
// Article collection
// ─────────────────────────────────────────────

function cleanMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .trim();
}

function getQuickSummary(body: string): string[] {
  const m = body.match(/##\s*Quick Summary\s*\n([\s\S]*?)(\n##\s|\n# |$)/i);
  if (!m) return [];
  return m[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => cleanMd(l.slice(2)))
    .filter((l) => l.length > 0)
    .slice(0, 4);
}

function getWeekArticles(): ArticleInfo[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const articles: ArticleInfo[] = [];
  for (const f of fs.readdirSync(CONTENT_DIR)) {
    if (!f.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf-8");
    const { data, content } = matter(raw);
    const dateStr = (data.date || "").toString();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    if (date < weekAgo || date > now) continue;

    articles.push({
      slug: f.replace(/\.mdx$/, ""),
      title: data.title || f.replace(/\.mdx$/, ""),
      description: (data.description || "").toString().trim(),
      date: dateStr,
      image: data.image ? `${SITE}${data.image}` : undefined,
      quickSummary: getQuickSummary(content),
    });
  }

  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ─────────────────────────────────────────────
// Draft builder
// ─────────────────────────────────────────────

function buildDraft(articles: ArticleInfo[]): WeeklyDraft {
  const id = new Date().toISOString().slice(0, 10);
  const subject =
    articles.length === 1
      ? `New on Zoltai: ${articles[0].title}`
      : `Zoltai Weekly: ${articles.length} new AI tool guides`;
  const preheader = (articles[0].description || articles[0].title).slice(0, 90);

  const blocks = articles
    .map((a) => {
      const url = link(`/blog/${a.slug}`, "zoltai-weekly");
      const img = a.image
        ? `<a href="${url}"><img src="${a.image}" alt="${escapeHtml(
            a.title
          )}" width="536" style="width: 100%; max-width: 536px; border-radius: 8px; border: 0; margin-bottom: 12px;" /></a>`
        : "";
      return `
    ${img}
    <h3 style="color: #ededed; font-size: 17px; margin: 0 0 8px 0;"><a href="${url}" style="color: #a78bfa; text-decoration: none;">${escapeHtml(
        a.title
      )}</a></h3>
    <p style="color: #a1a1aa; line-height: 1.7; margin: 0 0 8px 0;">${escapeHtml(
      a.description
    )}</p>
    <p style="margin: 0 0 24px 0;"><a href="${url}" style="color: #22d3ee; text-decoration: none;">Read the guide &rarr;</a></p>`;
    })
    .join("\n");

  const tips = articles[0].quickSummary;
  const tipBlock =
    tips.length > 0
      ? `
    <div style="background: #111113; border: 1px solid #1e1e1e; border-radius: 8px; padding: 20px; margin: 8px 0 24px 0;">
      <p style="color: #22d3ee; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 10px 0;">Quick summary: ${escapeHtml(
        articles[0].title
      )}</p>
      <ul style="color: #a1a1aa; line-height: 1.8; margin: 0; padding-left: 20px;">
        ${tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("\n        ")}
      </ul>
    </div>`
      : "";

  const content = `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">Here is what we published on Zoltai this week. Every guide compares tools on their documented features and current plans.</p>
    ${blocks}
    ${tipBlock}
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0;">See you next week,<br/>The Zoltai team</p>`;

  return {
    id,
    generatedAt: new Date().toISOString(),
    subject,
    preheader,
    html: wrap(content, preheader),
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      date: a.date,
    })),
  };
}

// ─────────────────────────────────────────────
// Subscribers (same merge as scripts/email-drip.ts)
// ─────────────────────────────────────────────

async function loadSubscribers(): Promise<Subscriber[]> {
  let localSubs: Subscriber[] = [];
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    localSubs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const resendKey = process.env.RESEND_API_KEY;

  if (audienceId && resendKey) {
    try {
      console.log("📡 Fetching subscribers from Resend Audience...");
      const res = await fetch(
        `https://api.resend.com/audiences/${audienceId}/contacts`,
        {
          headers: { Authorization: `Bearer ${resendKey}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const contacts = data.data || [];
        console.log(`   Found ${contacts.length} contacts in Resend Audience`);

        for (const contact of contacts) {
          const email = contact.email?.toLowerCase();
          if (!email) continue;

          const existing = localSubs.find((s) => s.email === email);
          if (contact.unsubscribed) {
            if (existing) existing.unsubscribed = true;
            continue;
          }
          if (!existing) {
            localSubs.push({
              email,
              name: contact.first_name || "",
              subscribedAt: contact.created_at || new Date().toISOString(),
              emailsSent: [0],
            });
          }
        }
        console.log(`   📋 Total merged subscribers: ${localSubs.length}`);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(
          `   ⚠️ Resend API error: ${JSON.stringify(err).slice(0, 200)}`
        );
      }
    } catch (err) {
      console.warn(
        `   ⚠️ Failed to fetch from Resend: ${(err as Error).message}`
      );
    }
  }

  return localSubs;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  name: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";

  if (!resendApiKey) {
    console.log(`   ⚠️ RESEND_API_KEY not set, skipping email to ${to}`);
    return false;
  }

  const personalizedHtml = html
    .replace(/\{\{name\}\}/g, name || "there")
    .replace(/\{\{unsubq\}\}/g, unsubQuery(to));

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html: personalizedHtml,
      headers: {
        "List-Unsubscribe": `<${SITE}/api/unsubscribe?${unsubQuery(to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error(`   ❌ Failed to send to ${to}:`, err);
    return false;
  }
  console.log(`   ✅ Sent "${subject}" to ${to}`);
  return true;
}

// ─────────────────────────────────────────────
// Modes
// ─────────────────────────────────────────────

async function runDraft() {
  console.log("🗒️  Building Zoltai Weekly draft...");
  const articles = getWeekArticles();
  console.log(`   Articles from the last 7 days: ${articles.length}`);

  if (articles.length === 0) {
    console.log("No new articles this week. No draft written.");
    // Remove any stale draft so it cannot be sent by accident
    if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
    return;
  }

  const draft = buildDraft(articles);
  fs.writeFileSync(DRAFT_FILE, JSON.stringify(draft, null, 2));
  console.log(`✅ Draft written to ${DRAFT_FILE}`);
  console.log(`   Subject: ${draft.subject}`);
  for (const a of draft.articles) {
    console.log(`   - ${a.date} ${a.title}`);
  }

  // Preview copy to the owner only (never to subscribers)
  const owner = process.env.REPORT_EMAIL_TO;
  if (owner) {
    console.log(`📨 Sending owner preview to ${owner}...`);
    await sendEmail(
      owner,
      `[Draft] ${draft.subject}`,
      draft.html,
      owner.split("@")[0]
    );
  }
}

async function runSend() {
  console.log("📮 Sending approved Zoltai Weekly issue...");

  if (!fs.existsSync(DRAFT_FILE)) {
    console.error("❌ No draft found at data/weekly-issue-draft.json.");
    process.exit(1);
  }
  const draft: WeeklyDraft = JSON.parse(fs.readFileSync(DRAFT_FILE, "utf-8"));

  // Stale-draft guard: drafts older than 7 days must be regenerated
  const ageDays =
    (Date.now() - new Date(draft.generatedAt).getTime()) /
    (1000 * 60 * 60 * 24);
  if (ageDays > 7) {
    console.error(
      `❌ Draft is ${Math.floor(ageDays)} days old. Regenerate with --draft.`
    );
    process.exit(1);
  }

  // Double-send guard
  let sentLog: string[] = [];
  if (fs.existsSync(LOG_FILE)) {
    sentLog = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  }
  if (sentLog.includes(draft.id)) {
    console.error(`❌ Issue ${draft.id} was already sent. Refusing to resend.`);
    process.exit(1);
  }

  const subscribers = (await loadSubscribers()).filter(
    (s) => !s.unsubscribed
  );
  console.log(`👥 Active subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log(
      "No active subscribers yet. Marking nothing as sent; the draft stays."
    );
    return;
  }

  if (subscribers.length > RESEND_DAILY_LIMIT_GUARD) {
    console.error(
      `❌ ${subscribers.length} active subscribers exceeds the Resend free daily guard (${RESEND_DAILY_LIMIT_GUARD}). Send in batches or upgrade the plan.`
    );
    process.exit(1);
  }

  let sent = 0;
  for (const sub of subscribers) {
    const ok = await sendEmail(sub.email, draft.subject, draft.html, sub.name);
    if (ok) sent++;
    await new Promise((r) => setTimeout(r, 100));
  }

  sentLog.push(draft.id);
  fs.writeFileSync(LOG_FILE, JSON.stringify(sentLog, null, 2));
  console.log(`\n✅ Issue ${draft.id} sent to ${sent} subscribers.`);
}

async function main() {
  const mode = process.argv.includes("--send") ? "send" : "draft";
  if (mode === "send") {
    await runSend();
  } else {
    await runDraft();
  }
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
