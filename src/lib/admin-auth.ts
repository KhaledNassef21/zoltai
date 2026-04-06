/**
 * Shared admin authentication utility.
 * Used by all admin API routes.
 *
 * Login creates token: admin:{timestamp}:{password} → base64
 * This utility verifies by decoding and checking password presence.
 */

import { cookies } from "next/headers";

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    if (!token?.value) return false;

    const decoded = Buffer.from(token.value, "base64").toString();
    const adminPassword = process.env.ADMIN_PASSWORD || "zoltai2026";

    // Token format from login: "admin:{timestamp}:{password}"
    // We verify by checking the password is in the decoded string
    return decoded.includes(adminPassword);
  } catch {
    return false;
  }
}
