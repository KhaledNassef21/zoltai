// src/app/api/newsletter/route.ts

import { NextRequest, NextResponse } from "next/server";

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

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";
    const adminEmail = process.env.REPORT_EMAIL_TO || "";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    // ========================================
    // 1. Add to Resend Audience (PRIMARY STORE)
    // ========================================
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    let subscriberAdded = false;
    
    if (audienceId) {
      try {
        const audienceRes = await fetch(
          `https://api.resend.com/audiences/${audienceId}/contacts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              first_name: firstName !== "there" ? firstName : undefined,
              last_name:
                name?.trim()?.split(" ").slice(1).join(" ") || undefined,
              unsubscribed: false,
            }),
          }
        );

        const audienceData = await audienceRes.json();

        if (audienceRes.ok) {
          subscriberAdded = true;
          console.log("✅ Subscriber added to Resend Audience:", email);
        } else {
          // Check if already exists (400 error with specific message)
          if (audienceData.statusCode === 400 && audienceData.message?.includes("already exists")) {
            subscriberAdded = true;
            console.log("ℹ️ Subscriber already exists:", email);
          } else {
            console.error("Audience add error:", audienceData);
          }
        }
      } catch (err) {
        console.error("Audience API error:", err);
      }
    }

    // ========================================
    // 2. Send Welcome Email
    // ========================================
    const welcomeRes = await fetch("https://api.resend.com/emails", {
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

    if (!welcomeRes.ok) {
      const err = await welcomeRes.json();
      console.error("Welcome email error:", err);
    }

    // ========================================
    // 3. Notify Admin
    // ========================================
    if (adminEmail) {
      try {
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
      } catch (adminErr) {
        console.error("Admin notification error:", adminErr);
      }
    }

    // ========================================
    // 4. Save to Local File (OPTIONAL - Local/CI Only)
    // ========================================
    // ⚠️ This will NOT work on Vercel (read-only filesystem)
    // Drip campaign uses Resend Audience contacts instead
    const isLocal = process.env.VERCEL !== "1";
    
    if (isLocal) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const SUBSCRIBERS_FILE = path.join(
          process.cwd(),
          "data/subscribers.json"
        );

        let subscribers: Array<{
          email: string;
          name: string;
          subscribedAt: string;
          emailsSent: number[];
        }> = [];

        if (fs.existsSync(SUBSCRIBERS_FILE)) {
          subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
        }

        const existing = subscribers.find((s) => s.email === email);
        if (!existing) {
          subscribers.push({
            email,
            name: name?.trim() || "",
            subscribedAt: new Date().toISOString(),
            emailsSent: [0],
          });

          const dir = path.dirname(SUBSCRIBERS_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
          console.log("✅ Subscriber saved to local file");
        }
      } catch (fileErr) {
        // Expected to fail on Vercel — that's OK
        console.log("ℹ️ Local file write skipped (Vercel/CI environment)");
      }
    }

    // ========================================
    // 5. Return Success
    // ========================================
    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
      subscriberAdded,
    });
  } catch (err) {
    console.error("Newsletter error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
