import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "data/subscribers.json");

interface Subscriber {
  email: string;
  name: string;
  subscribedAt: string;
  emailsSent: number[];
}

function loadSubscribers(): Subscriber[] {
  if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
}

function saveSubscribers(subs: Subscriber[]) {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subs, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const firstName = name?.trim()?.split(" ")[0] || "there";

    // Save subscriber locally for drip campaign
    const subscribers = loadSubscribers();
    const existing = subscribers.find((s) => s.email === email);
    if (!existing) {
      subscribers.push({
        email,
        name: name?.trim() || "",
        subscribedAt: new Date().toISOString(),
        emailsSent: [0], // 0 = welcome email
      });
      saveSubscribers(subscribers);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";
    const adminEmail = process.env.REPORT_EMAIL_TO || "";

    if (resendApiKey) {
      try {
        // Add to Resend audience
        const audienceId = process.env.RESEND_AUDIENCE_ID;
        if (audienceId) {
          await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              first_name: firstName !== "there" ? firstName : undefined,
              last_name: name?.trim()?.split(" ").slice(1).join(" ") || undefined,
              unsubscribed: false,
            }),
          });
        }

        // Welcome email (Email 0)
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: "🎉 Welcome to Zoltai — Start Making Money with AI",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin-bottom: 16px;">Welcome to Zoltai, ${firstName}!</h1>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  You just unlocked your guide to <strong style="color: #ededed;">making money with AI tools</strong> — no coding required.
                </p>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  Over the next week, I'll send you:
                </p>
                <ul style="color: #a1a1aa; line-height: 2; font-size: 16px;">
                  <li>💰 Top 5 AI tools to start earning today</li>
                  <li>📝 Step-by-step guide to make your first $100</li>
                  <li>⚡ Honest comparison of AI tools that pay</li>
                  <li>🏆 My #1 recommended tool for beginners</li>
                </ul>
                <div style="margin: 32px 0; text-align: center;">
                  <a href="https://zoltai.org/tools" style="display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    🔥 Explore AI Tools Now
                  </a>
                </div>
                <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
                  P.S. Check your inbox tomorrow — I'll send you the Top 5 tools that are making people real money right now.
                </p>
                <hr style="border-color: #1e1e1e; margin: 24px 0;" />
                <p style="color: #666; font-size: 12px; text-align: center;">
                  Zoltai — Make Money Using AI Tools | <a href="https://zoltai.org" style="color: #666;">zoltai.org</a>
                </p>
              </div>
            `,
          }),
        });

        // Notify admin
        if (adminEmail) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: adminEmail,
              subject: `🎉 New Subscriber: ${name || email}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
                  <h2 style="color: #7c3aed;">New Newsletter Subscriber!</h2>
                  <table style="width: 100%; color: #a1a1aa; font-size: 16px; line-height: 2;">
                    <tr><td style="color: #71717a;">Name:</td><td style="font-weight: 600; color: #ededed;">${name || "—"}</td></tr>
                    <tr><td style="color: #71717a;">Email:</td><td style="font-weight: 600; color: #ededed;">${email}</td></tr>
                    <tr><td style="color: #71717a;">Time:</td><td style="font-weight: 600; color: #ededed;">${new Date().toISOString()}</td></tr>
                  </table>
                  <hr style="border-color: #1e1e1e; margin: 24px 0;" />
                  <p style="color: #666; font-size: 12px; text-align: center;">Zoltai Admin</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
