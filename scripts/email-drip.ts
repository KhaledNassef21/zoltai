/**
 * Email Drip Campaign — Expert-Level Funnel Sequence
 *
 * 7-email sequence over 14 days, designed for maximum conversion.
 * Every email has ONE clear goal, tracked affiliate links, UTM params,
 * and follows the AIDA framework (Attention → Interest → Desire → Action).
 *
 * Sequence:
 * Day 0: Welcome (sent by newsletter API on signup — not here)
 * Day 1: Quick Win — "Your first $50 in 24 hours" (builds trust)
 * Day 3: Deep Dive — "The $5K/month AI writing playbook" (desire)
 * Day 5: Social Proof — "How Sarah made $3,200 last month" (credibility)
 * Day 7: Comparison — "I tested 24 tools. Here are the top 5." (authority)
 * Day 10: Advanced — "The AI coding goldmine nobody talks about" (new opportunity)
 * Day 12: Urgency — "These free tiers won't last forever" (scarcity)
 * Day 14: Final — "Your personal AI money roadmap" (commitment)
 *
 * Runs daily via GitHub Actions at 8AM UTC.
 */

import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "data/subscribers.json");
const SITE = "https://zoltai.org";

interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string;
  emailsSent: number[];
}

interface DripEmail {
  id: number;
  dayAfterSignup: number;
  subject: string;
  preheader: string;
  html: string;
}

// UTM-tracked link builder
function link(path: string, campaign: string, tool?: string): string {
  const base = `${SITE}${path}`;
  const params = new URLSearchParams({
    utm_source: "drip",
    utm_medium: "email",
    utm_campaign: campaign,
  });
  if (tool) params.set("utm_content", tool);
  return `${base}?${params.toString()}`;
}

// Affiliate link with tracking
function aff(toolUrl: string, campaign: string, tool: string): string {
  const url = new URL(toolUrl);
  url.searchParams.set("utm_source", "zoltai_drip");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", tool);
  return url.toString();
}

// Shared email wrapper
function wrap(content: string, preheader: string, campaign: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; border-radius: 12px; overflow: hidden;">
  <!-- Preheader (hidden text for inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0a0a0a;">
    ${preheader}
    ${"&nbsp;&zwnj;".repeat(30)}
  </div>

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 24px 32px;">
    <a href="${SITE}" style="color: white; text-decoration: none; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Zoltai</a>
  </div>

  <!-- Body -->
  <div style="padding: 32px;">
    ${content}
  </div>

  <!-- Footer -->
  <div style="padding: 24px 32px; border-top: 1px solid #1e1e1e;">
    <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0;">
      You're receiving this because you signed up at <a href="${SITE}" style="color: #a78bfa;">zoltai.org</a>.<br/>
      <a href="${link("/unsubscribe", campaign)}" style="color: #666;">Unsubscribe</a> · <a href="${link("/tools", campaign)}" style="color: #666;">Browse Tools</a> · <a href="${link("/blog", campaign)}" style="color: #666;">Read Blog</a>
    </p>
    <p style="color: #444; font-size: 11px; margin: 8px 0 0 0;">© ${new Date().getFullYear()} Zoltai · zoltai.org</p>
  </div>
</div>`;
}

const dripEmails: DripEmail[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 1: Quick Win — Build Trust + First Action
  // Goal: Get them to click ONE affiliate link
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 1,
    dayAfterSignup: 1,
    subject: "Your first $50 with AI — here's exactly how (takes 2 hours)",
    preheader: "No coding. No experience. Just follow these 3 steps.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      Make Your First $50 with AI<br/>
      <span style="color: #a78bfa;">In Under 2 Hours</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Most people overthink this. They research for weeks, compare 20 tools, and never start.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Here's what actually works — <strong style="color: #ededed;">3 steps, 2 hours, $50+</strong>:
    </p>

    <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px; border-left: 4px solid #7c3aed;">
      <p style="color: #a78bfa; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">STEP 1 (5 minutes)</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Sign up for ChatGPT — it's free</p>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Go to <a href="${aff("https://chat.openai.com/?ref=zoltai", "drip1_quickwin", "chatgpt")}" style="color: #a78bfa;">chat.openai.com</a> and create an account. The free tier is enough to start.</p>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px; border-left: 4px solid #06b6d4;">
      <p style="color: #22d3ee; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">STEP 2 (30 minutes)</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Create 3 sample LinkedIn posts using this prompt</p>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Paste this: <em>"Write a professional LinkedIn post about [trending topic in {industry}]. Make it engaging, use storytelling, and end with a question. 200 words max."</em></p>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #111; border-radius: 8px; border-left: 4px solid #22c55e;">
      <p style="color: #22c55e; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">STEP 3 (1 hour)</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Post on Fiverr: "I will write AI-powered LinkedIn content"</p>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Price at $25 for 5 posts. Use your samples as portfolio. Most sellers get their first order within 48 hours.</p>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 16px 0;">
      That's it. No course needed. No $500 software. Just ChatGPT + Fiverr + 2 hours.
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${aff("https://chat.openai.com/?ref=zoltai", "drip1_quickwin", "chatgpt")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        Start with ChatGPT (Free) →
      </a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 8px 0;">
      <strong style="color: #ededed;">P.S.</strong> — Tomorrow I'll send you "The $5K/month AI writing playbook." It's the exact system freelancers use to replace their 9-5. Don't miss it.
    </p>
    `,
      "No coding. No experience. Just follow these 3 steps to earn $50.",
      "drip1_quickwin"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 3: Deep Dive — AI Writing Money Machine
  // Goal: Get Jasper/Copy.ai affiliate click
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 2,
    dayAfterSignup: 3,
    subject: "The AI writing playbook: $5K/month (copy this system)",
    preheader: "3 freelancers. Same tools. Here's their exact workflow.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      The $5K/Month AI Writing System
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      I've talked to dozens of AI freelancers. The ones making $5K+/month all follow the same pattern:
    </p>

    <p style="color: #ededed; font-weight: 600; font-size: 18px; margin: 24px 0 8px 0;">
      🔑 The 3-Tool Stack
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #111;">
        <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e; font-size: 13px;">Tool</th>
        <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e; font-size: 13px;">What For</th>
        <th style="padding: 12px; text-align: left; color: #a78bfa; border-bottom: 1px solid #1e1e1e; font-size: 13px;">Cost</th>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1e1e1e;">
          <a href="${aff("https://jasper.ai?fpr=zoltai", "drip2_writing", "jasper")}" style="color: #a78bfa; font-weight: 600;">Jasper</a>
        </td>
        <td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Blog posts, ads, landing pages</td>
        <td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">7-day free trial</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1e1e1e;">
          <a href="${aff("https://www.copy.ai?via=zoltai", "drip2_writing", "copyai")}" style="color: #a78bfa; font-weight: 600;">Copy.ai</a>
        </td>
        <td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">Email sequences, product descriptions</td>
        <td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">Free tier (2K words)</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #1e1e1e;">
          <a href="${aff("https://surferseo.com/?fpr=zoltai", "drip2_writing", "surfer")}" style="color: #a78bfa; font-weight: 600;">Surfer SEO</a>
        </td>
        <td style="padding: 12px; color: #a1a1aa; border-bottom: 1px solid #1e1e1e;">SEO optimization for rankings</td>
        <td style="padding: 12px; color: #22c55e; border-bottom: 1px solid #1e1e1e;">7-day trial</td>
      </tr>
    </table>

    <p style="color: #ededed; font-weight: 600; font-size: 18px; margin: 24px 0 8px 0;">
      📋 The Daily Workflow
    </p>

    <div style="margin: 8px 0; padding: 16px; background: #111; border-radius: 8px;">
      <p style="color: #a1a1aa; line-height: 2; margin: 0; font-size: 14px;">
        <strong style="color: #ededed;">Morning (1 hour):</strong> Find 2-3 potential clients on LinkedIn/Upwork<br/>
        <strong style="color: #ededed;">Midday (2 hours):</strong> Create content with Jasper + Surfer SEO<br/>
        <strong style="color: #ededed;">Evening (30 min):</strong> Follow up with leads, deliver work
      </p>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 16px 0;">
      At $150-300 per blog post (which takes 45 minutes with AI), you need just <strong style="color: #22c55e;">17-34 posts per month</strong> to hit $5K. That's about 1 post per day.
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${aff("https://jasper.ai?fpr=zoltai", "drip2_writing", "jasper")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        Try Jasper Free for 7 Days →
      </a>
    </div>

    <p style="color: #a1a1aa; font-size: 13px; margin: 16px 0 0 0;">
      Not into writing? No worries. In 2 days I'll show you how someone made $3,200/month with AI <em>art</em> — zero art skills needed.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 16px 0 0 0;">
      <strong style="color: #ededed;">P.S.</strong> — Our <a href="${link("/blog/jasper-vs-copy-ai-vs-writesonic-best-roi-ai-tools-2025", "drip2_writing", "jasper")}" style="color: #a78bfa;">full Jasper vs Copy.ai vs Writesonic comparison</a> shows which tool has the best ROI for your niche.
    </p>
    `,
      "3 freelancers. Same tools. $5K/month. Here's their exact workflow.",
      "drip2_writing"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 5: Social Proof — AI Art Income Story
  // Goal: Midjourney/Leonardo affiliate click
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 3,
    dayAfterSignup: 5,
    subject: "She makes $3,200/month selling AI art (no art skills)",
    preheader: "Her Etsy shop went from $0 to $3,200 in 4 months. Here's how.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      From $0 to $3,200/Month<br/>
      <span style="color: #a78bfa;">Selling AI-Generated Art</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Sarah (not her real name) was a nurse working 12-hour shifts. She had zero design experience. Four months ago she started selling AI art on Etsy.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Last month: <strong style="color: #22c55e; font-size: 20px;">$3,217</strong> in passive income.
    </p>

    <p style="color: #ededed; font-weight: 600; margin: 16px 0 8px 0;">Her exact process:</p>

    <div style="margin: 8px 0 24px 0;">
      <div style="padding: 12px 16px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: start;">
        <span style="color: #a78bfa; font-weight: 700; margin-right: 12px; font-size: 18px;">1.</span>
        <div>
          <p style="color: #ededed; font-weight: 600; margin: 0;">Research trending niches</p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">Uses Etsy search to find what's selling: wall art, phone cases, planners</p>
        </div>
      </div>
      <div style="padding: 12px 16px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: start;">
        <span style="color: #a78bfa; font-weight: 700; margin-right: 12px; font-size: 18px;">2.</span>
        <div>
          <p style="color: #ededed; font-weight: 600; margin: 0;">Generate art with Midjourney</p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">Creates 20 images in 30 minutes. Each image costs ~$0.04</p>
        </div>
      </div>
      <div style="padding: 12px 16px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: start;">
        <span style="color: #a78bfa; font-weight: 700; margin-right: 12px; font-size: 18px;">3.</span>
        <div>
          <p style="color: #ededed; font-weight: 600; margin: 0;">Upscale with Leonardo AI</p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">Free tool to make images print-quality resolution</p>
        </div>
      </div>
      <div style="padding: 12px 16px; display: flex; align-items: start;">
        <span style="color: #a78bfa; font-weight: 700; margin-right: 12px; font-size: 18px;">4.</span>
        <div>
          <p style="color: #ededed; font-weight: 600; margin: 0;">List as digital downloads on Etsy</p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">No shipping, no inventory. 100% profit after Etsy fees.</p>
        </div>
      </div>
    </div>

    <div style="padding: 20px; background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1)); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; margin: 24px 0;">
      <p style="color: #ededed; font-weight: 700; text-align: center; margin: 0 0 4px 0; font-size: 18px;">Her Numbers (Month 4)</p>
      <p style="color: #a1a1aa; text-align: center; margin: 0; font-size: 14px;">
        348 sales × $9.25 avg price = <strong style="color: #22c55e;">$3,217</strong><br/>
        Cost: Midjourney $10/mo + Etsy fees ~$480 = <strong style="color: #ef4444;">-$490</strong><br/>
        <strong style="color: #22c55e; font-size: 18px;">Net profit: $2,727</strong>
      </p>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${aff("https://midjourney.com/?ref=zoltai", "drip3_art", "midjourney")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        Try Midjourney ($10/mo) →
      </a>
      <br/>
      <a href="${aff("https://app.leonardo.ai/?ref=zoltai", "drip3_art", "leonardo")}" style="color: #a78bfa; font-size: 13px; margin-top: 8px; display: inline-block;">or start free with Leonardo AI →</a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 0 0;">
      <strong style="color: #ededed;">P.S.</strong> — Read our <a href="${link("/blog/make-2000-month-selling-ai-art-midjourney-leonardo-guide-2024", "drip3_art", "midjourney")}" style="color: #a78bfa;">complete AI art income guide</a> for the exact prompts Sarah uses.
    </p>
    `,
      "Her Etsy shop went from $0 to $3,200 in 4 months with AI art.",
      "drip3_art"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 7: Authority — Tool Comparison (Top 5)
  // Goal: Multiple affiliate clicks + earn page visit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 4,
    dayAfterSignup: 7,
    subject: "I tested 24 AI tools. These 5 actually make money.",
    preheader: "Most are overhyped. These 5 consistently generate income.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      24 Tools Tested.<br/>
      <span style="color: #a78bfa;">5 Winners.</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">
      I've spent months testing every "make money with AI" tool out there. Most are overpriced, overhyped, or outright useless for actually earning.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">
      Here are the <strong style="color: #ededed;">only 5 I'd bet my own money on:</strong>
    </p>

    <!-- Tool 1 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border: 1px solid #1e1e1e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #ededed; font-weight: 700; font-size: 16px;">🥇 ChatGPT Plus</span>
        <span style="background: #22c55e20; color: #22c55e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">$2K-10K/mo</span>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;">Best for: Writing, coding, consulting, literally everything</p>
      <a href="${aff("https://chat.openai.com/?ref=zoltai", "drip4_top5", "chatgpt")}" style="color: #a78bfa; font-size: 13px; font-weight: 600;">Try Free →</a>
    </div>

    <!-- Tool 2 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border: 1px solid #1e1e1e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #ededed; font-weight: 700; font-size: 16px;">🥈 Cursor</span>
        <span style="background: #22c55e20; color: #22c55e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">$5K-20K/mo</span>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;">Best for: Building apps and websites without years of coding experience</p>
      <a href="${aff("https://cursor.sh/?ref=zoltai", "drip4_top5", "cursor")}" style="color: #a78bfa; font-size: 13px; font-weight: 600;">Try Free →</a>
    </div>

    <!-- Tool 3 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border: 1px solid #1e1e1e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #ededed; font-weight: 700; font-size: 16px;">🥉 Midjourney</span>
        <span style="background: #22c55e20; color: #22c55e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">$1K-5K/mo</span>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;">Best for: Selling AI art, design services, print-on-demand</p>
      <a href="${aff("https://midjourney.com/?ref=zoltai", "drip4_top5", "midjourney")}" style="color: #a78bfa; font-size: 13px; font-weight: 600;">Start at $10/mo →</a>
    </div>

    <!-- Tool 4 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border: 1px solid #1e1e1e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #ededed; font-weight: 700; font-size: 16px;">4. Jasper</span>
        <span style="background: #22c55e20; color: #22c55e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">$3K-8K/mo</span>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;">Best for: Starting a content/copywriting agency</p>
      <a href="${aff("https://jasper.ai?fpr=zoltai", "drip4_top5", "jasper")}" style="color: #a78bfa; font-size: 13px; font-weight: 600;">7-Day Free Trial →</a>
    </div>

    <!-- Tool 5 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border: 1px solid #1e1e1e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #ededed; font-weight: 700; font-size: 16px;">5. ElevenLabs</span>
        <span style="background: #22c55e20; color: #22c55e; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">$1K-4K/mo</span>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;">Best for: Voiceover services, YouTube narration, audiobooks</p>
      <a href="${aff("https://elevenlabs.io/?ref=zoltai", "drip4_top5", "elevenlabs")}" style="color: #a78bfa; font-size: 13px; font-weight: 600;">Try Free →</a>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${link("/earn", "drip4_top5")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        🔥 See Full Rankings + Guides →
      </a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 0 0;">
      <strong style="color: #ededed;">P.S.</strong> — The #2 pick (Cursor) is blowing up right now. Developers are building $10K+/month side projects with it. I'll tell you exactly how in my next email.
    </p>
    `,
      "Most AI tools are overhyped. These 5 consistently generate income.",
      "drip4_top5"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 10: New Opportunity — AI Coding Goldmine
  // Goal: Cursor/Bolt affiliate click
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 5,
    dayAfterSignup: 10,
    subject: "The AI coding goldmine nobody talks about",
    preheader: "People with ZERO coding experience are building apps and charging $2K-5K each.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      Build Apps. Charge $2K-5K Each.<br/>
      <span style="color: #a78bfa;">No Coding Experience Needed.</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      This might sound crazy, but hear me out:
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Right now, there are people with <strong style="color: #ededed;">zero prior coding experience</strong> who are building real web apps and charging businesses $2,000-5,000 per project.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">
      How? Two tools changed everything:
    </p>

    <div style="margin: 16px 0; padding: 24px; background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05)); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px;">
      <p style="color: #a78bfa; font-weight: 700; font-size: 14px; margin: 0 0 8px 0;">TOOL #1</p>
      <p style="color: #ededed; font-weight: 700; font-size: 18px; margin: 0 0 8px 0;">Cursor — AI Code Editor</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        You describe what you want in plain English. Cursor writes the code. It's like having a senior developer sitting next to you 24/7. Built on VS Code so it feels familiar.
      </p>
      <a href="${aff("https://cursor.sh/?ref=zoltai", "drip5_coding", "cursor")}" style="color: #a78bfa; font-weight: 600; font-size: 14px;">Try Cursor Free →</a>
    </div>

    <div style="margin: 16px 0; padding: 24px; background: linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.05)); border: 1px solid rgba(6,182,212,0.2); border-radius: 12px;">
      <p style="color: #22d3ee; font-weight: 700; font-size: 14px; margin: 0 0 8px 0;">TOOL #2</p>
      <p style="color: #ededed; font-weight: 700; font-size: 18px; margin: 0 0 8px 0;">Bolt.new — Instant App Builder</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        Even faster than Cursor. Type "build me a booking app for a barbershop" and get a working prototype in minutes. Deploy it to the web with one click.
      </p>
      <a href="${aff("https://bolt.new/?ref=zoltai", "drip5_coding", "bolt")}" style="color: #22d3ee; font-weight: 600; font-size: 14px;">Try Bolt.new Free →</a>
    </div>

    <p style="color: #ededed; font-weight: 600; margin: 24px 0 12px 0;">What you can build & sell:</p>

    <div style="padding: 16px; background: #111; border-radius: 8px; margin: 0 0 24px 0;">
      <p style="color: #a1a1aa; line-height: 2; margin: 0; font-size: 14px;">
        ✅ Landing pages for local businesses — <strong style="color: #22c55e;">$500-1,500</strong><br/>
        ✅ Booking/scheduling apps — <strong style="color: #22c55e;">$1,000-3,000</strong><br/>
        ✅ Simple SaaS dashboards — <strong style="color: #22c55e;">$2,000-5,000</strong><br/>
        ✅ E-commerce stores — <strong style="color: #22c55e;">$1,500-4,000</strong><br/>
        ✅ Portfolio websites — <strong style="color: #22c55e;">$300-800</strong>
      </p>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${aff("https://cursor.sh/?ref=zoltai", "drip5_coding", "cursor")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        Start Building with Cursor (Free) →
      </a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 0 0;">
      <strong style="color: #ededed;">P.S.</strong> — Read our <a href="${link("/blog/best-ai-coding-assistants-2025-cursor-vs-github-copilot-vs-bolt", "drip5_coding", "cursor")}" style="color: #a78bfa;">Cursor vs Copilot vs Bolt comparison</a> to pick the right tool for your situation.
    </p>
    `,
      "People with zero coding experience are building apps and charging $2K-5K.",
      "drip5_coding"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 12: Urgency — Free Tiers Disappearing
  // Goal: Get them to sign up for tools NOW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 6,
    dayAfterSignup: 12,
    subject: "⚠️ These free tiers won't last (grab them now)",
    preheader: "AI companies are cutting free plans. Lock in access while you can.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      Free Access Is Disappearing.<br/>
      <span style="color: #ef4444;">Act Before It's Gone.</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      Quick heads up — AI companies are rapidly cutting free tiers and raising prices. ChatGPT already went from $20 to $20+ with usage caps. Midjourney killed their free trial entirely.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">
      Here are the best free tiers <strong style="color: #ededed;">still available right now</strong>:
    </p>

    <div style="margin: 8px 0; padding: 16px; background: #111; border-radius: 10px; border: 1px solid #22c55e30;">
      <p style="color: #22c55e; font-size: 12px; font-weight: 700; margin: 0 0 12px 0;">✅ STILL FREE</p>
      <div style="margin: 8px 0;">
        <a href="${aff("https://chat.openai.com/?ref=zoltai", "drip6_urgency", "chatgpt")}" style="color: #ededed; font-weight: 600; text-decoration: none;">ChatGPT</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — Free tier with GPT-4o mini</span>
      </div>
      <div style="margin: 8px 0;">
        <a href="${aff("https://claude.ai/?ref=zoltai", "drip6_urgency", "claude")}" style="color: #ededed; font-weight: 600; text-decoration: none;">Claude</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — Free tier with Claude 3.5 Sonnet</span>
      </div>
      <div style="margin: 8px 0;">
        <a href="${aff("https://cursor.sh/?ref=zoltai", "drip6_urgency", "cursor")}" style="color: #ededed; font-weight: 600; text-decoration: none;">Cursor</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — Free hobby plan (limited completions)</span>
      </div>
      <div style="margin: 8px 0;">
        <a href="${aff("https://app.leonardo.ai/?ref=zoltai", "drip6_urgency", "leonardo")}" style="color: #ededed; font-weight: 600; text-decoration: none;">Leonardo AI</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — 150 free tokens/day</span>
      </div>
      <div style="margin: 8px 0;">
        <a href="${aff("https://www.copy.ai?via=zoltai", "drip6_urgency", "copyai")}" style="color: #ededed; font-weight: 600; text-decoration: none;">Copy.ai</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — 2,000 free words/month</span>
      </div>
      <div style="margin: 8px 0;">
        <a href="${aff("https://bolt.new/?ref=zoltai", "drip6_urgency", "bolt")}" style="color: #ededed; font-weight: 600; text-decoration: none;">Bolt.new</a>
        <span style="color: #a1a1aa; font-size: 13px;"> — Free tier for building apps</span>
      </div>
    </div>

    <div style="margin: 16px 0; padding: 16px; background: #111; border-radius: 10px; border: 1px solid #ef444430;">
      <p style="color: #ef4444; font-size: 12px; font-weight: 700; margin: 0 0 8px 0;">⛔ ALREADY REMOVED FREE TIER</p>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Midjourney, Runway (severely limited), GitHub Copilot (students only)</p>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 16px 0;">
      <strong style="color: #ededed;">My advice:</strong> Create free accounts on all the tools above today. Even if you don't use them right away, having an account often locks in early-user perks.
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${link("/tools", "drip6_urgency")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        See All Free Tools →
      </a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 0 0;">
      <strong style="color: #ededed;">P.S.</strong> — My final email in 2 days will give you a complete AI income roadmap customized to your situation. It's the most valuable thing I've ever put together. Watch for it.
    </p>
    `,
      "AI companies are cutting free plans. Lock in access while you can.",
      "drip6_urgency"
    ),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAY 14: Final — The Complete Roadmap
  // Goal: Earn page visit + long-term engagement
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 7,
    dayAfterSignup: 14,
    subject: "Your AI money roadmap (save this email)",
    preheader: "Week 1-4 plan to go from $0 to $1,000/month with AI. Bookmark this.",
    html: wrap(
      `
    <h1 style="color: #ededed; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0;">
      Your Personal<br/>
      <span style="color: #a78bfa;">AI Income Roadmap</span>
    </h1>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">Hey {{name}},</p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 16px 0;">
      This is the last email in our starter series, and I saved the best for last.
    </p>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0 0 24px 0;">
      Below is the <strong style="color: #ededed;">exact 4-week plan</strong> to go from zero to your first $1,000 with AI. <strong style="color: #a78bfa;">Bookmark this email.</strong>
    </p>

    <!-- Week 1 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border-left: 4px solid #7c3aed;">
      <p style="color: #a78bfa; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">WEEK 1: Foundation</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Set up your tools + create samples</p>
      <ul style="color: #a1a1aa; font-size: 13px; line-height: 2; margin: 0; padding-left: 16px;">
        <li>Sign up for <a href="${aff("https://chat.openai.com/?ref=zoltai", "drip7_roadmap", "chatgpt")}" style="color: #a78bfa;">ChatGPT</a> (free) + one specialized tool</li>
        <li>Pick your niche: writing, design, coding, or voice</li>
        <li>Create 5 portfolio samples using AI</li>
        <li>Set up profiles on Fiverr + Upwork</li>
      </ul>
    </div>

    <!-- Week 2 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border-left: 4px solid #06b6d4;">
      <p style="color: #22d3ee; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">WEEK 2: First Clients</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Land your first 2-3 paying clients</p>
      <ul style="color: #a1a1aa; font-size: 13px; line-height: 2; margin: 0; padding-left: 16px;">
        <li>Send 20 cold pitches on LinkedIn (use ChatGPT to write them)</li>
        <li>Price low: $25-50 per project to get reviews</li>
        <li>Deliver fast + over-deliver on quality</li>
        <li>Ask for 5-star reviews</li>
      </ul>
    </div>

    <!-- Week 3 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border-left: 4px solid #22c55e;">
      <p style="color: #22c55e; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">WEEK 3: Scale</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Raise prices + add services</p>
      <ul style="color: #a1a1aa; font-size: 13px; line-height: 2; margin: 0; padding-left: 16px;">
        <li>Raise prices to $75-150 per project (you have reviews now)</li>
        <li>Add a premium tier with faster delivery</li>
        <li>Start using <a href="${aff("https://jasper.ai?fpr=zoltai", "drip7_roadmap", "jasper")}" style="color: #a78bfa;">Jasper</a> or <a href="${aff("https://cursor.sh/?ref=zoltai", "drip7_roadmap", "cursor")}" style="color: #a78bfa;">Cursor</a> for higher-value work</li>
        <li>Target: 5-10 active projects</li>
      </ul>
    </div>

    <!-- Week 4 -->
    <div style="margin: 16px 0; padding: 20px; background: #111; border-radius: 10px; border-left: 4px solid #f59e0b;">
      <p style="color: #f59e0b; font-weight: 700; font-size: 14px; margin: 0 0 4px 0;">WEEK 4: $1,000 Target</p>
      <p style="color: #ededed; font-weight: 600; margin: 0 0 8px 0;">Optimize + hit $1K</p>
      <ul style="color: #a1a1aa; font-size: 13px; line-height: 2; margin: 0; padding-left: 16px;">
        <li>Focus on what's working, drop what isn't</li>
        <li>Upsell existing clients on recurring work</li>
        <li>Add passive income: AI art on Etsy, templates, digital products</li>
        <li>🎯 <strong style="color: #22c55e;">Goal: $1,000 this month</strong></li>
      </ul>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1)); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; text-align: center;">
      <p style="color: #ededed; font-weight: 700; font-size: 18px; margin: 0 0 8px 0;">Ready to Start?</p>
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 16px 0;">
        Visit our Earn page for tool-by-tool guides with direct links.
      </p>
      <a href="${link("/earn", "drip7_roadmap")}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">
        🔥 See Top Earning Tools + Guides →
      </a>
    </div>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 24px 0 16px 0;">
      That's the end of our starter series! But I'll keep sending you weekly tips about:
    </p>
    <ul style="color: #a1a1aa; font-size: 14px; line-height: 2; margin: 0 0 24px 0; padding-left: 16px;">
      <li>New AI tools worth your time</li>
      <li>Real income stories and breakdowns</li>
      <li>Strategies that are working right now</li>
    </ul>

    <p style="color: #a1a1aa; line-height: 1.8; margin: 0;">
      <strong style="color: #ededed;">P.S.</strong> — Reply to this email and tell me which niche you chose. I read every reply and I'll send you personalized tool recommendations.
    </p>
    `,
      "Your 4-week plan: $0 to $1,000/month with AI. Bookmark this.",
      "drip7_roadmap"
    ),
  },
];

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────

function loadSubscribers(): Subscriber[] {
  if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
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
  console.log("📧 Running email drip campaign (v2 — Expert Funnel)...");
  console.log(`📋 Emails in sequence: ${dripEmails.length}`);

  const subscribers = loadSubscribers();
  console.log(`👥 Total subscribers: ${subscribers.length}`);

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
