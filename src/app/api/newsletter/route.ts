import { NextRequest, NextResponse } from "next/server";

// Simple file-based subscriber store (can upgrade to database later)
// In production, you'd use Resend contacts API or a database

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

    // Send welcome email via Resend if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Zoltai <hello@zoltai.ai>";

    if (resendApiKey) {
      // Add to Resend audience/contacts
      try {
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

        // Send welcome email
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: "Welcome to Zoltai — Your AI Journey Starts Here",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin-bottom: 16px;">Welcome to Zoltai, ${firstName}!</h1>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  You're now part of a growing community of AI enthusiasts and productivity hackers.
                </p>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  Every week, you'll receive:
                </p>
                <ul style="color: #a1a1aa; line-height: 2; font-size: 16px;">
                  <li>The best new AI tools reviewed</li>
                  <li>Productivity tips and workflows</li>
                  <li>Exclusive deals and free trials</li>
                </ul>
                <div style="margin: 32px 0; text-align: center;">
                  <a href="https://zoltai.ai/tools" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Explore AI Tools
                  </a>
                </div>
                <hr style="border-color: #1e1e1e; margin: 24px 0;" />
                <p style="color: #666; font-size: 12px; text-align: center;">
                  Zoltai — AI Tools & Productivity
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        // Don't fail the subscription if email fails
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
