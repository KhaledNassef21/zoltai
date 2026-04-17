/**
 * YouTube OAuth2 — one-time refresh-token generator
 *
 * Run this ONCE locally to log in with the channel's Google account and
 * print a YOUTUBE_REFRESH_TOKEN. Paste that into GitHub Secrets so the
 * CI uploader can run headless.
 *
 * Setup:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create OAuth client ID → type: "Desktop app"
 *   3. Download client_id + client_secret → put in .env.local:
 *        YOUTUBE_CLIENT_ID=...
 *        YOUTUBE_CLIENT_SECRET=...
 *   4. Enable "YouTube Data API v3" in the same project
 *   5. Run: npx tsx scripts/youtube-auth.ts
 *   6. Open the printed URL, approve, copy the code back to the terminal
 *   7. Copy the printed refresh_token → GitHub Secret YOUTUBE_REFRESH_TOKEN
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

async function main() {
  loadEnv();

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "❌ Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET in .env.local"
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "urn:ietf:wg:oauth:2.0:oob"
  );

  // `offline` + `consent` forces Google to return a refresh_token every time
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
    ],
  });

  console.log("\n📺 YouTube OAuth2 — refresh token generator\n");
  console.log("1) Open this URL in a browser logged in as the target channel:");
  console.log(`\n   ${authUrl}\n`);
  console.log("2) Approve access, then paste the authorization code below.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code: string = await new Promise((resolve) =>
    rl.question("Code: ", (a) => {
      rl.close();
      resolve(a.trim());
    })
  );

  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "❌ No refresh_token returned. Revoke existing access at " +
        "https://myaccount.google.com/permissions and try again."
    );
    process.exit(1);
  }

  console.log("\n✅ Success! Save this refresh token as a GitHub secret:\n");
  console.log(`   YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  console.log("Scopes:", tokens.scope);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
