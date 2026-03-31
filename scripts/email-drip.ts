/**
 * Email Drip Campaign Script
 *
 * Runs daily via GitHub Actions. Checks subscribers and sends
 * the right email based on their signup date.
 *
 * Sequence:
 * Day 0: Welcome email (sent immediately on signup - handled by newsletter API)
 * Day 1: "Top 5 AI Tools to Start Making Money"
 * Day 3: "Step-by-Step: How to Make Your First $100 with AI"
 * Day 5: "Best AI Tools That Actually Pay (Comparison)"
 * Day 7: "The #1 AI Tool I Recommend for Beginners"
 */

import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "data/subscribers.json");

interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string;
  emailsSent: number[]; // array of drip IDs already sent
}

interface DripEmail {
  id: number;
  dayAfterSignup: number;
  subject: string;
  html: string;
}

const SITE_URL = "https://zoltai.org";

const dripEmails: DripEmail[] = [
  {
    id: 1,
    dayAfterSignup: 1,
    subject: "💰 Top 5 AI Tools to Start Making Money Today",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
        <h1 style="color: #7c3aed; font-size: 24px;">Top 5 AI Tools to Start Making Money</h1>
        <p style="color: #a1a1aa; line-height: 1.8;">Hey {{name}}! Ready to start earning with AI? Here are the top 5 tools I recommend:</p>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px; border-left: 3px solid #7c3aed;">
          <h3 style="color: #ededed; margin: 0;">1. ChatGPT — Write & Earn</h3>
          <p style="color: #a1a1aa; margin: 8px 0;">Use it for freelance writing, emails, and content creation. Many freelancers earn $2K-5K/month.</p>
          <a href="${SITE_URL}/tools" style="color: #a78bfa;">Try ChatGPT →</a>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px; border-left: 3px solid #7c3aed;">
          <h3 style="color: #ededed; margin: 0;">2. Midjourney — Sell AI Art</h3>
          <p style="color: #a1a1aa; margin: 8px 0;">Create stunning art and sell on Etsy, Redbubble, or as freelance design work.</p>
          <a href="${SITE_URL}/tools" style="color: #a78bfa;">Try Midjourney →</a>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px; border-left: 3px solid #7c3aed;">
          <h3 style="color: #ededed; margin: 0;">3. Jasper — Marketing at Scale</h3>
          <p style="color: #a1a1aa; margin: 8px 0;">Write ads, blog posts, and marketing copy 10x faster. Start a copywriting agency.</p>
          <a href="${SITE_URL}/tools" style="color: #a78bfa;">Try Jasper →</a>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px; border-left: 3px solid #7c3aed;">
          <h3 style="color: #ededed; margin: 0;">4. Canva AI — Design Without Skills</h3>
          <p style="color: #a1a1aa; margin: 8px 0;">Create social media graphics, logos, and presentations. Offer design services on Fiverr.</p>
          <a href="${SITE_URL}/tools" style="color: #a78bfa;">Try Canva →</a>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px; border-left: 3px solid #7c3aed;">
          <h3 style="color: #ededed; margin: 0;">5. ElevenLabs — AI Voiceovers</h3>
          <p style="color: #a1a1aa; margin: 8px 0;">Create voiceovers for YouTube, podcasts, and audiobooks. Growing demand!</p>
          <a href="${SITE_URL}/tools" style="color: #a78bfa;">Try ElevenLabs →</a>
        </div>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${SITE_URL}/tools" style="display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Explore All 24+ AI Tools →
          </a>
        </div>

        <hr style="border-color: #1e1e1e; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px; text-align: center;">Zoltai — Make Money Using AI Tools | <a href="${SITE_URL}" style="color: #666;">zoltai.org</a></p>
      </div>
    `,
  },
  {
    id: 2,
    dayAfterSignup: 3,
    subject: "📝 Step-by-Step: Make Your First $100 with AI",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
        <h1 style="color: #7c3aed; font-size: 24px;">Make Your First $100 with AI</h1>
        <p style="color: #a1a1aa; line-height: 1.8;">Hey {{name}}! Here's a simple plan to make your first $100 using AI — no coding needed.</p>

        <div style="margin: 24px 0;">
          <h3 style="color: #ededed;">Step 1: Pick Your Skill (5 min)</h3>
          <p style="color: #a1a1aa;">Choose one: Writing, Design, Video, or Voice. You don't need to be an expert — AI does the heavy lifting.</p>

          <h3 style="color: #ededed;">Step 2: Set Up Your AI Tool (10 min)</h3>
          <p style="color: #a1a1aa;">Sign up for a free account. ChatGPT for writing, Canva for design, ElevenLabs for voice.</p>

          <h3 style="color: #ededed;">Step 3: Create a Portfolio (1 hour)</h3>
          <p style="color: #a1a1aa;">Use AI to create 3-5 sample works. This proves your skills to clients.</p>

          <h3 style="color: #ededed;">Step 4: List Your Service (30 min)</h3>
          <p style="color: #a1a1aa;">Post on Fiverr, Upwork, or directly reach out to businesses on LinkedIn.</p>

          <h3 style="color: #ededed;">Step 5: Deliver & Earn</h3>
          <p style="color: #a1a1aa;">Most beginners land their first gig within a week. Price at $25-50 to start. That's your first $100!</p>
        </div>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${SITE_URL}/blog" style="display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Read More Money-Making Guides →
          </a>
        </div>

        <hr style="border-color: #1e1e1e; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px; text-align: center;">Zoltai — Make Money Using AI Tools | <a href="${SITE_URL}" style="color: #666;">zoltai.org</a></p>
      </div>
    `,
  },
  {
    id: 3,
    dayAfterSignup: 5,
    subject: "⚡ Best AI Tools That Actually Pay (Honest Comparison)",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
        <h1 style="color: #7c3aed; font-size: 24px;">AI Tools That Actually Help You Earn</h1>
        <p style="color: #a1a1aa; line-height: 1.8;">Hey {{name}}! Not all AI tools are equal for making money. Here's my honest breakdown:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr style="background: #111;">
            <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e;">Tool</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e;">Best For</th>
            <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e;">Earning Potential</th>
          </tr>
          <tr><td style="padding: 12px; color: #ededed; border-bottom: 1px solid #1e1e1e;">ChatGPT</td><td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Writing & Coding</td><td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">$2K-10K/mo</td></tr>
          <tr><td style="padding: 12px; color: #ededed; border-bottom: 1px solid #1e1e1e;">Midjourney</td><td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">AI Art & Design</td><td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">$1K-5K/mo</td></tr>
          <tr><td style="padding: 12px; color: #ededed; border-bottom: 1px solid #1e1e1e;">Jasper</td><td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Marketing Copy</td><td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">$3K-8K/mo</td></tr>
          <tr><td style="padding: 12px; color: #ededed; border-bottom: 1px solid #1e1e1e;">Cursor</td><td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Building Apps</td><td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">$5K-20K/mo</td></tr>
          <tr><td style="padding: 12px; color: #ededed; border-bottom: 1px solid #1e1e1e;">Canva AI</td><td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Social Media</td><td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">$500-3K/mo</td></tr>
        </table>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${SITE_URL}/tools" style="display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Compare All Tools →
          </a>
        </div>

        <hr style="border-color: #1e1e1e; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px; text-align: center;">Zoltai — Make Money Using AI Tools | <a href="${SITE_URL}" style="color: #666;">zoltai.org</a></p>
      </div>
    `,
  },
  {
    id: 4,
    dayAfterSignup: 7,
    subject: "🏆 The #1 AI Tool I Recommend for Beginners",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
        <h1 style="color: #7c3aed; font-size: 24px;">My #1 Recommendation for You</h1>
        <p style="color: #a1a1aa; line-height: 1.8;">Hey {{name}}! After reviewing 24+ AI tools, there's one I recommend the most for beginners who want to start earning:</p>

        <div style="margin: 24px 0; padding: 24px; background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1)); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px;">
          <h2 style="color: #ededed; margin: 0 0 8px 0; font-size: 22px;">🥇 ChatGPT Plus</h2>
          <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">The most versatile AI tool. Writing, coding, analysis, images — it does everything. With GPT-4, you can start earning from day one.</p>
          <ul style="color: #a1a1aa; line-height: 2;">
            <li>✅ Free tier available (great for testing)</li>
            <li>✅ Plus plan only $20/month (pays for itself quickly)</li>
            <li>✅ Huge market demand for ChatGPT skills</li>
            <li>✅ Works for writing, coding, marketing, research</li>
          </ul>
          <div style="margin-top: 16px; text-align: center;">
            <a href="${SITE_URL}/tools" style="display: inline-block; padding: 14px 32px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
              🔥 Start Making Money with ChatGPT →
            </a>
          </div>
        </div>

        <p style="color: #a1a1aa; line-height: 1.8; margin-top: 24px;">
          <strong style="color: #ededed;">What's next?</strong> Check out our full tools directory for 24+ AI tools, each with free trials and earning strategies.
        </p>

        <div style="margin: 24px 0; text-align: center;">
          <a href="${SITE_URL}/tools" style="color: #a78bfa; font-weight: 600;">Browse All AI Tools →</a>
        </div>

        <hr style="border-color: #1e1e1e; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px; text-align: center;">Zoltai — Make Money Using AI Tools | <a href="${SITE_URL}" style="color: #666;">zoltai.org</a></p>
      </div>
    `,
  },
];

function loadSubscribers(): Subscriber[] {
  if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
}

function saveSubscribers(subs: Subscriber[]) {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
}

async function sendEmail(to: string, subject: string, html: string, name: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";

  if (!resendApiKey) {
    console.log(`   ⚠️ RESEND_API_KEY not set, skipping email to ${to}`);
    return;
  }

  const personalizedHtml = html.replace(/\{\{name\}\}/g, name || "there");

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

  const subscribers = loadSubscribers();
  console.log(`📋 Total subscribers: ${subscribers.length}`);

  if (subscribers.length === 0) {
    console.log("No subscribers yet.");
    return;
  }

  const now = new Date();
  let emailsSentCount = 0;

  for (const sub of subscribers) {
    const signupDate = new Date(sub.subscribedAt);
    const daysSinceSignup = Math.floor(
      (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const drip of dripEmails) {
      if (daysSinceSignup >= drip.dayAfterSignup && !sub.emailsSent.includes(drip.id)) {
        console.log(`\n📨 Sending drip #${drip.id} to ${sub.email} (day ${daysSinceSignup})`);
        await sendEmail(sub.email, drip.subject, drip.html, sub.name);
        sub.emailsSent.push(drip.id);
        emailsSentCount++;
      }
    }
  }

  saveSubscribers(subscribers);
  console.log(`\n✅ Done! Sent ${emailsSentCount} emails total.`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
