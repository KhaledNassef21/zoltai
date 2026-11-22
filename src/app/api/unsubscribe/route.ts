import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

async function markUnsubscribed(email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  let done = false;

  // 1. Resend Audience (primary store, also read by the drip script)
  if (apiKey && audienceId) {
    try {
      const res = await fetch(
        `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ unsubscribed: true }),
        }
      );
      // 404 means the contact is not in the audience, which is fine
      done = res.ok || res.status === 404;
      if (!done) console.error("Resend unsubscribe error:", res.status);
    } catch (err) {
      console.error("Resend unsubscribe error:", err);
    }
  }

  // 2. Fallback only when Resend could not record it: subscribers file in GitHub
  if (!done) {
    try {
      const { readFile, writeFile } = await import("@/lib/github");
      const file = await readFile("data/subscribers.json");
      const list: Array<{ email: string; unsubscribed?: boolean }> = file
        ? JSON.parse(file.content)
        : [];
      const sub = list.find((s) => s.email === email);
      if (sub && !sub.unsubscribed) {
        sub.unsubscribed = true;
        await writeFile(
          "data/subscribers.json",
          JSON.stringify(list, null, 2),
          `Unsubscribe: ${email}`
        );
      }
      done = true;
    } catch (err) {
      console.error("GitHub unsubscribe error:", err);
    }
  }
  return done;
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  let email = url.searchParams.get("e") || "";
  let token = url.searchParams.get("t") || "";

  if (req.method === "POST" && (!email || !token)) {
    try {
      const form = await req.formData();
      email = String(form.get("e") || "");
      token = String(form.get("t") || "");
    } catch {}
  }

  email = email.trim().toLowerCase();
  const isOneClick = url.searchParams.has("e") && req.method === "POST";

  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  }

  const ok = await markUnsubscribed(email);
  if (!ok) {
    return NextResponse.json({ error: "Could not unsubscribe. Please try again." }, { status: 500 });
  }

  // Mail clients using one-click unsubscribe expect a plain 200
  if (isOneClick) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL("/unsubscribe?done=1", req.url), 303);
}

// GET is deliberately not supported: link scanners would unsubscribe people by accident.
export async function POST(req: NextRequest) {
  return handle(req);
}
