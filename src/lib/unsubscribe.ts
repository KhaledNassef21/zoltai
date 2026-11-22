import { createHmac, timingSafeEqual } from "crypto";

const SITE = "https://zoltai.org";

function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "";
}

/** Signed token for one email address, so nobody can unsubscribe other people. */
export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!secret() || !email || !token) return false;
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrl(email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${SITE}/unsubscribe?e=${e}&t=${unsubscribeToken(email)}`;
}

/** Headers that give mail clients a one-click unsubscribe button. */
export function unsubscribeHeaders(email: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE}/api/unsubscribe?e=${encodeURIComponent(
      email.trim().toLowerCase()
    )}&t=${unsubscribeToken(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
