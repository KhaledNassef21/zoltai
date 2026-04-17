/**
 * YouTube OAuth2 — one-time refresh-token generator
 *
 * Run this ONCE locally to log in with the channel's Google account and
 * print a YOUTUBE_REFRESH_TOKEN. Paste that into GitHub Secrets so the
 * CI uploader can run headless.
 *
 * Setup (already done if .env.local has YOUTUBE_CLIENT_ID/SECRET):
 *   1. Google Cloud → APIs & Services → Credentials
 *   2. OAuth client ID, type "Desktop app"
 *   3. The downloaded JSON has redirect_uri = http://localhost
 *   4. Enable "YouTube Data API v3" in the same project
 *
 * Run:
 *   npx tsx scripts/youtube-auth.ts
 *
 * What happens:
 *   - Spins up a tiny local HTTP server on a random free port
 *   - Opens (or prints) a Google consent URL pointing at that port
 *   - You log in with the YouTube channel's Google account, approve scopes
 *   - Google redirects back to http://localhost:<port>?code=...
 *   - The script captures the code, exchanges for a refresh token,
 *     prints it, then exits.
 */

import fs from "fs";
import path from "path";
import http from "http";
import { URL } from "url";
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

function waitForCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url || "/", `http://localhost:${port}`);
        const code = reqUrl.searchParams.get("code");
        const error = reqUrl.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>OAuth error</h1><pre>${error}</pre>`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html><body style="font-family:system-ui;padding:40px;text-align:center;background:#0a0a0a;color:#fff">
              <h1 style="color:#22d3ee">✅ تم الربط بنجاح</h1>
              <p>تقدر تقفل الصفحة دي وترجع للتيرمنال.</p>
            </body></html>
          `);
          server.close();
          resolve(code);
          return;
        }

        res.writeHead(404);
        res.end("Not found");
      } catch (err) {
        reject(err as Error);
      }
    });

    server.listen(port, () => {
      console.log(`🟢 Local callback server listening on http://localhost:${port}`);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for OAuth callback (5 minutes)"));
    }, 5 * 60 * 1000);
  });
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

  // Use a fixed port so it matches the redirect_uri configured in Google Cloud.
  // The downloaded client_secret.json declares redirect_uris: ["http://localhost"]
  // which means Google accepts ANY port on localhost — pick one we control.
  const port = 53682;
  const redirectUri = `http://localhost:${port}`;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
    ],
  });

  console.log("\n📺 YouTube OAuth2 — refresh token generator\n");
  console.log("1) Open this URL in a browser logged in as the YouTube channel owner:");
  console.log(`\n   ${authUrl}\n`);
  console.log("2) Approve access. The browser will redirect to localhost.");
  console.log("3) The script will capture the code automatically.\n");

  const code = await waitForCode(port);

  console.log("\n🔑 Exchanging code for tokens...");
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "\n❌ No refresh_token returned. Revoke existing access at " +
        "https://myaccount.google.com/permissions and re-run this script."
    );
    process.exit(1);
  }

  console.log("\n✅ Success! Save this refresh token as a GitHub Secret named YOUTUBE_REFRESH_TOKEN:\n");
  console.log(`   ${tokens.refresh_token}\n`);
  console.log("Scopes granted:", tokens.scope);
  console.log("\nAlso writing to .env.local for local testing...");

  // Update .env.local with the new refresh token
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    if (envText.match(/^YOUTUBE_REFRESH_TOKEN=/m)) {
      envText = envText.replace(
        /^YOUTUBE_REFRESH_TOKEN=.*$/m,
        `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`
      );
    } else {
      envText += `\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    }
    fs.writeFileSync(envPath, envText);
    console.log("✅ .env.local updated\n");
  } catch (err) {
    console.warn(`⚠️  Could not update .env.local: ${(err as Error).message}`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
