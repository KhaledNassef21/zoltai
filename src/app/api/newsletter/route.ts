import { NextRequest, NextResponse } from "next/server";

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const trimmed = email.trim().toLowerCase();

  // Common typos
  const commonTypos: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "yahooo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com",
  };

  const domain = trimmed.split("@")[1];
  if (commonTypos[domain]) {
    console.warn(`Common typo detected: ${domain} → ${commonTypos[domain]}`);
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    // Clean input
    const cleanEmail = email?.trim()?.toLowerCase() || "";
    const cleanName = name?.trim() || "";

    // Validate email
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const firstName = cleanName.split(" ")[0] || "there";

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Zoltai <noreply@zoltai.org>";
    const adminEmail = process.env.REPORT_EMAIL_TO || "zoltai.official@gmail.com";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    // 1. Add to Resend Audience (primary subscriber store)
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
              email: cleanEmail,
              first_name: firstName !== "there" ? firstName : undefined,
              last_name: cleanName.split(" ").slice(1).join(" ") || undefined,
              unsubscribed: false,
            }),
          }
        );

        const audienceData = await audienceRes.json();

        if (audienceRes.ok) {
          subscriberAdded = true;
          console.log("✅ Subscriber added to Resend Audience:", cleanEmail);
        } else if (
          audienceData.statusCode === 400 &&
          audienceData.message?.includes("already exists")
        ) {
          subscriberAdded = true;
          console.log("ℹ️ Subscriber already exists:", cleanEmail);
        } else {
          console.error("Audience add error:", audienceData);
        }
      } catch (err) {
        console.error("Audience API error:", err);
      }
    }

    // 2. Send Welcome Email
    const welcomeRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: cleanEmail,
        subject: "Welcome to Zoltai — Your AI Tools Journey Starts Here",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
            <h1 style="color: #7c3aed; font-size: 28px; margin-bottom: 16px;">Welcome to Zoltai, ${firstName}!</h1>
            <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
              You just unlocked your guide to <strong style="color: #ededed;">mastering AI tools</strong> — no coding required.
            </p>
            <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
              Over the next week, I'll send you:
            </p>
            <ul style="color: #a1a1aa; line-height: 2; font-size: 16px;">
              <li>💰 Top 5 AI tools to explore this week</li>
              <li>📝 Step-by-step guide to get started with AI</li>
              <li>⚡ Honest comparison of the best AI tools</li>
              <li>🏆 My #1 recommended tool for beginners</li>
            </ul>
            <div style="margin: 32px 0; text-align: center;">
              <a href="https://zoltai.org/tools" style="display: inline-block; padding: 14px 28px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Explore AI Tools Now
              </a>
            </div>
            <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
              P.S. Check your inbox tomorrow — I'll send you the Top 5 tools that are transforming how people work right now.
            </p>
            <hr style="border-color: #1e1e1e; margin: 24px 0;" />
            <p style="color: #666; font-size: 12px; text-align: center;">
              Zoltai — Discover the Best AI Tools | <a href="https://zoltai.org" style="color: #666;">zoltai.org</a>
            </p>
          </div>
        `,
      }),
    });

    if (!welcomeRes.ok) {
      const err = await welcomeRes.json();
      console.error("Welcome email error:", err);

      // Handle bounce errors
      if (err.statusCode === 400 && err.message?.includes("recipient")) {
        return NextResponse.json(
          {
            error: "Invalid email address. Please check and try again.",
            code: "INVALID_RECIPIENT",
            details: err.message,
          },
          { status: 400 }
        );
      }
    }

    // 3. Notify Admin
    if (adminEmail && isValidEmail(adminEmail)) {
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
            subject: `🎉 New Subscriber: ${cleanName || cleanEmail}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
                <h2 style="color: #7c3aed;">New Newsletter Subscriber!</h2>
                <table style="width: 100%; color: #a1a1aa; font-size: 16px; line-height: 2;">
                  <tr><td style="color: #71717a;">Name:</td><td style="font-weight: 600; color: #ededed;">${cleanName || "—"}</td></tr>
                  <tr><td style="color: #71717a;">Email:</td><td style="font-weight: 600; color: #ededed;">${cleanEmail}</td></tr>
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

    // 4. Save to local file + GitHub API (for drip campaign)
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

      // Try local file first
      try {
        if (fs.existsSync(SUBSCRIBERS_FILE)) {
          subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, "utf-8"));
        }
      } catch {}

      const existing = subscribers.find((s) => s.email === cleanEmail);
      if (!existing) {
        subscribers.push({
          email: cleanEmail,
          name: cleanName,
          subscribedAt: new Date().toISOString(),
          emailsSent: [0],
        });

        // Try local file write
        try {
          const dir = path.dirname(SUBSCRIBERS_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            SUBSCRIBERS_FILE,
            JSON.stringify(subscribers, null, 2)
          );
        } catch {
          // Read-only on Vercel — use GitHub API
        }

        // Also save to GitHub API (persistent across deployments)
        try {
          const { readFile, writeFile } = await import("@/lib/github");
          const githubPath = "data/subscribers.json";
          const ghFile = await readFile(githubPath);

          let ghSubscribers: typeof subscribers = [];
          if (ghFile) {
            ghSubscribers = JSON.parse(ghFile.content);
          }

          const ghExisting = ghSubscribers.find((s) => s.email === cleanEmail);
          if (!ghExisting) {
            ghSubscribers.push({
              email: cleanEmail,
              name: cleanName,
              subscribedAt: new Date().toISOString(),
              emailsSent: [0],
            });

            await writeFile(
              githubPath,
              JSON.stringify(ghSubscribers, null, 2),
              `Add subscriber: ${cleanEmail}`,
              ghFile?.sha
            );
            console.log("✅ Subscriber saved to GitHub");
          }
        } catch (ghErr) {
          console.error("GitHub save error:", ghErr);
        }
      }
    } catch {
      // Fallback: Resend audience is the primary store anyway
    }

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
