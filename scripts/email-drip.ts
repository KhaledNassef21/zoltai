/**
 * Email drip sequence: 7 plain emails over 14 days (Day 1, 3, 5, 7, 10, 12, 14).
 *
 * Rules: no earnings or income claims, no "tested" claims, no urgency framing,
 * no unverified prices, official links only. Each email points to a Zoltai guide.
 * Every email carries a signed unsubscribe link and List-Unsubscribe headers.
 * Day 0 (welcome) is sent by the newsletter API on signup, not here.
 *
 * Runs daily via GitHub Actions at 8AM UTC.
 */

import fs from "fs";
import path from "path";

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

const SUBSCRIBERS_FILE = path.join(process.cwd(), "data/subscribers.json");
const SITE = "https://zoltai.org";

interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string;
  emailsSent: number[];
  unsubscribed?: boolean;
}

interface DripEmail {
  id: number;
  dayAfterSignup: number;
  subject: string;
  preheader: string;
  html: string;
}

import { createHmac } from "crypto";

function unsubToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "";
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function unsubQuery(email: string): string {
  return `e=${encodeURIComponent(email.trim().toLowerCase())}&t=${unsubToken(email)}`;
}

// UTM-tracked link builder
function link(path: string, campaign: string): string {
  const params = new URLSearchParams({
    utm_source: "drip",
    utm_medium: "email",
    utm_campaign: campaign,
  });
  return `${SITE}${path}?${params.toString()}`;
}

// Shared email wrapper. {{unsub}} is replaced per recipient at send time.
function wrap(content: string, preheader: string, campaign: string): string {
  void campaign;
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; border-radius: 12px; overflow: hidden;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0a0a0a;">${preheader}</div>
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 24px 32px;">
    <a href="${SITE}" style="color: white; text-decoration: none; font-size: 20px; font-weight: 700;"><img src="${SITE}/icons/icon-192.png" width="40" height="40" alt="Zoltai" style="vertical-align: middle; border-radius: 8px; border: 0; margin-right: 10px;" /><span style="vertical-align: middle;">Zoltai</span></a>
  </div>
  <div style="padding: 32px;">
    ${content}
    <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">Prices and features were checked on November 22, 2026. Vendors change them, so check the vendor's pricing page.</p>
  </div>
  <div style="padding: 24px 32px; border-top: 1px solid #1e1e1e;">
    <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0;">
      You are receiving this because you signed up at <a href="${SITE}" style="color: #a78bfa;">zoltai.org</a>.<br/>
      <a href="${SITE}/unsubscribe?{{unsubq}}" style="color: #666;">Unsubscribe</a>
    </p>
    <p style="color: #444; font-size: 11px; margin: 8px 0 0 0;">© ${new Date().getFullYear()} Zoltai · zoltai.org</p>
  </div>
</div>`;
}

const dripEmails: DripEmail[] = [
  {
    id: 1,
    dayAfterSignup: 1,
    subject: 'Start with one task: a short guide to AI tools',
    preheader: 'One small task is enough to start.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Most small business owners do not need a long list of AI tools. A better start is to pick one task you repeat every week, such as writing customer emails, booking calls or taking meeting notes, and try one tool on it.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Our starter guide covers five AI tools for small business owners, with plans and prices checked against each vendor's own pages.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Free plans and trials have limits, so check each vendor's current pricing page before you pay for anything.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-5-ai-tools-for-small-business-owners-in-2026", "drip1_start")}" style="color: #a78bfa; font-weight: 600;">Read: Top 5 AI tools for small business owners in 2026 →</a></p>
    </div>
    `,
      'One small task is enough to start.',
      "drip1_start"
    ),
  },
  {
    id: 3,
    dayAfterSignup: 3,
    subject: 'Three AI meeting notes tools with free plans',
    preheader: 'Otter.ai, Fireflies.ai and Fathom, compared.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">If you spend time in video calls, a meeting notes tool can record the call, write a transcript and send a summary. Our guide compares Otter.ai, Fireflies.ai and Fathom, based on each vendor's documented features.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Each of the three lists a free plan on its own pricing or help pages. Free plans have limits on minutes, storage or AI features, so read the limits against the length of your meetings.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Tell everyone on the call that a notetaker is recording, and read each summary before you share it.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-meeting-notes-tools-for-small-businesses-in-2026", "drip2_meetings")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI meeting notes tools →</a></p>
    </div>
    `,
      'Otter.ai, Fireflies.ai and Fathom, compared.',
      "drip2_meetings"
    ),
  },
  {
    id: 5,
    dayAfterSignup: 5,
    subject: 'AI tools for scheduling and project tracking',
    preheader: 'Fewer back-and-forth messages, one place for tasks.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Two things eat time in a small team: finding a time to meet and keeping track of who does what. These two guides cover both.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">The scheduling guide covers Calendly, Reclaim.ai and Motion. The project tools guide covers Trello, Asana and Notion. Both describe each tool from its documented features and current plans.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Start with one free plan and one real week of use.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-scheduling-tools-for-small-businesses-in-2026", "drip3_planning")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI scheduling tools →</a></p>
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-project-management-tools-for-small-businesses-in-2026", "drip3_planning")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI project management tools →</a></p>
    </div>
    `,
      'Fewer back-and-forth messages, one place for tasks.',
      "drip3_planning"
    ),
  },
  {
    id: 7,
    dayAfterSignup: 7,
    subject: 'Email marketing and CRM tools to compare',
    preheader: 'Keep in touch with customers and keep track of leads.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Two guides for staying in touch with customers. The email marketing guide covers Mailchimp, Brevo, MailerLite and Constant Contact. The CRM guide covers Pipedrive, Zoho CRM and HubSpot CRM.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Prices on these pages often show launch discounts. Both guides say so, and suggest you check what the price becomes after the discount ends.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-4-email-marketing-tools-with-ai-for-small-businesses", "drip4_customers")}" style="color: #a78bfa; font-weight: 600;">Read: Top 4 email marketing tools with AI →</a></p>
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-crm-tools-for-small-businesses-in-2026", "drip4_customers")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI CRM tools →</a></p>
    </div>
    `,
      'Keep in touch with customers and keep track of leads.',
      "drip4_customers"
    ),
  },
  {
    id: 10,
    dayAfterSignup: 10,
    subject: 'AI tools for presentations and writing',
    preheader: 'Slides, emails and translations in less time.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">If you write a lot of emails or build slide decks, these two guides may save you time. The presentation guide covers Gamma, Beautiful.ai and Pitch. The writing and translation guide covers Grammarly, DeepL and Wordtune.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">AI drafts can be wrong. Check every number, name and translation before you send or present.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-presentation-tools-for-small-businesses-in-2026", "drip5_content")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI presentation tools →</a></p>
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-writing-and-translation-helpers-for-small-businesses-in-2026", "drip5_content")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI writing and translation helpers →</a></p>
    </div>
    `,
      'Slides, emails and translations in less time.',
      "drip5_content"
    ),
  },
  {
    id: 12,
    dayAfterSignup: 12,
    subject: 'Bookkeeping tools: what to check before you pay',
    preheader: 'QuickBooks Online, Xero and Wave.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Bookkeeping tools often advertise steep first-year discounts. Our guide covers QuickBooks Online, Xero and Wave and points out where the price you see today is not the price you pay later.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Before you commit to any paid plan, check the total due today, the renewal price and what the plan includes. Ask your accountant to look at the setup.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog/top-3-ai-bookkeeping-tools-for-small-businesses-in-2026", "drip6_books")}" style="color: #a78bfa; font-weight: 600;">Read: Top 3 AI bookkeeping tools →</a></p>
    </div>
    `,
      'QuickBooks Online, Xero and Wave.',
      "drip6_books"
    ),
  },
  {
    id: 14,
    dayAfterSignup: 14,
    subject: 'Your AI tools checklist',
    preheader: 'A short checklist to finish the series.',
    html: wrap(
      `
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hi {{name}},</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">This is the last email in the series. A short checklist if you want to try an AI tool this month:</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">1. Pick one task you repeat every week.<br/>2. Try the free plan or trial of one tool on that task.<br/>3. Read every result before you use it.<br/>4. Check the current pricing page before you pay, including the renewal price.<br/>5. Keep the tool only if it saves you time.</p>
    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">You can browse all our guides and tool pages any time. Thanks for reading.</p>
    <div style="margin: 24px 0;">
    <p style="margin: 0 0 12px 0;"><a href="${link("/tools", "drip7_checklist")}" style="color: #a78bfa; font-weight: 600;">Browse AI tools →</a></p>
    <p style="margin: 0 0 12px 0;"><a href="${link("/blog", "drip7_checklist")}" style="color: #a78bfa; font-weight: 600;">Read the blog →</a></p>
    </div>
    `,
      'A short checklist to finish the series.',
      "drip7_checklist"
    ),
  },
];

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────

async function loadSubscribers(): Promise<Subscriber[]> {
  // Try local file first
  let localSubs: Subscriber[] = [];
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    localSubs = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
  }

  // Also fetch from Resend Audience API (production subscriber store)
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

        // Merge Resend contacts into local subscribers
        for (const contact of contacts) {
          const email = contact.email?.toLowerCase();
          if (!email) continue;

          const existing = localSubs.find((s) => s.email === email);
          if (contact.unsubscribed) {
            // Respect unsubscribes recorded in Resend for people already in the file
            if (existing) existing.unsubscribed = true;
            continue;
          }
          if (!existing) {
            localSubs.push({
              email,
              name: contact.first_name || "",
              subscribedAt: contact.created_at || new Date().toISOString(),
              emailsSent: [0], // Welcome email already sent by newsletter API
            });
          }
        }

        // Save merged list back to local file
        saveSubscribers(localSubs);
        console.log(`   📋 Total merged subscribers: ${localSubs.length}`);
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(`   ⚠️ Resend API error: ${JSON.stringify(err).slice(0, 200)}`);
      }
    } catch (err) {
      console.warn(`   ⚠️ Failed to fetch from Resend: ${(err as Error).message}`);
    }
  }

  return localSubs;
}

function saveSubscribers(subs: Subscriber[]) {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  name: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";

  if (!resendApiKey) {
    console.log(`   ⚠️ RESEND_API_KEY not set, skipping email to ${to}`);
    return;
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
  } else {
    console.log(`   ✅ Sent "${subject}" to ${to}`);
  }
}

async function main() {
  console.log("📧 Running email drip campaign...");
  console.log(`📋 Emails in sequence: ${dripEmails.length}`);

  const subscribers = await loadSubscribers();
  console.log(`👥 Total subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log("No subscribers yet.");
    return;
  }

  const now = new Date();
  let emailsSentCount = 0;

  for (const sub of subscribers) {
    if (sub.unsubscribed) continue;
    const signupDate = new Date(sub.subscribedAt);
    const daysSinceSignup = Math.floor(
      (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const drip of dripEmails) {
      if (
        daysSinceSignup >= drip.dayAfterSignup &&
        !sub.emailsSent.includes(drip.id)
      ) {
        console.log(
          `\n📨 Sending drip #${drip.id} (Day ${drip.dayAfterSignup}) to ${sub.email} (subscribed ${daysSinceSignup} days ago)`
        );
        await sendEmail(sub.email, drip.subject, drip.html, sub.name);
        sub.emailsSent.push(drip.id);
        emailsSentCount++;

        // Rate limit: 100ms between emails (Resend free tier = 100/day)
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  saveSubscribers(subscribers);
  console.log(`\n✅ Done! Sent ${emailsSentCount} emails total.`);
  console.log(
    `📊 Sequence: 7 emails over 14 days (Day 1, 3, 5, 7, 10, 12, 14)`
  );
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
