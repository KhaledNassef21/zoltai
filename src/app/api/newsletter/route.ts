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
      process.env.RESEND_FROM_EMAIL || "Zoltai <info.zoltai@gmail.com>";
    const adminEmail = process.env.REPORT_EMAIL_TO || "";

    if (resendApiKey) {
      try {
        // Add to Resend audience/contacts
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

        // Send welcome email to subscriber
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: "Welcome to Zoltai — Start Making Money with AI",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
                <h1 style="color: #7c3aed; font-size: 28px; margin-bottom: 16px;">Welcome to Zoltai, ${firstName}!</h1>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  You're now part of a growing community learning to make money with AI tools — no coding required.
                </p>
                <p style="color: #a1a1aa; line-height: 1.8; font-size: 16px;">
                  Every week, you'll receive:
                </p>
                <ul style="color: #a1a1aa; line-height: 2; font-size: 16px;">
                  <li>The best AI tools to earn money online</li>
                  <li>Step-by-step money-making strategies</li>
                  <li>Exclusive deals and free trials</li>
                  <li>Productivity hacks to 10x your output</li>
                </ul>
                <div style="margin: 32px 0; text-align: center;">
                  <a href="https://zoltai.vercel.app/tools" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Explore AI Tools
                  </a>
                </div>
                <hr style="border-color: #1e1e1e; margin: 24px 0;" />
                <p style="color: #666; font-size: 12px; text-align: center;">
                  Zoltai — Make Money Using AI Tools
                </p>
              </div>
            `,
          }),
        });

        // Notify admin about new subscriber
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
                  <h2 style="color: #7c3aed; margin-bottom: 16px;">New Newsletter Subscriber!</h2>
                  <table style="width: 100%; color: #a1a1aa; font-size: 16px; line-height: 2;">
                    <tr><td style="color: #71717a;">Name:</td><td style="font-weight: 600; color: #ededed;">${name || "—"}</td></tr>
                    <tr><td style="color: #71717a;">Email:</td><td style="font-weight: 600; color: #ededed;">${email}</td></tr>
                    <tr><td style="color: #71717a;">Time:</td><td style="font-weight: 600; color: #ededed;">${new Date().toISOString()}</td></tr>
                  </table>
                  <hr style="border-color: #1e1e1e; margin: 24px 0;" />
                  <p style="color: #666; font-size: 12px; text-align: center;">Zoltai Admin Notification</p>
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
