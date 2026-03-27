interface GSCCredentials {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
}

function getCredentials(): GSCCredentials {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GSC_SITE_URL;

  if (!clientEmail || !privateKey || !siteUrl) {
    throw new Error("Google Search Console credentials not configured");
  }

  return { clientEmail, privateKey, siteUrl };
}

async function getAccessToken(): Promise<string> {
  const { clientEmail, privateKey } = getCredentials();

  // Create JWT for Google service account
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(privateKey, "base64url");

  const jwt = `${header}.${claim}.${signature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function getSearchAnalytics(
  days: number = 28
): Promise<SearchAnalyticsRow[]> {
  const { siteUrl } = getCredentials();
  const accessToken = await getAccessToken();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        dimensions: ["query", "page"],
        rowLimit: 100,
      }),
    }
  );

  const data = await response.json();
  return data.rows || [];
}

export async function getIndexingIssues(): Promise<
  { url: string; issue: string }[]
> {
  const { siteUrl } = getCredentials();
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: siteUrl,
        siteUrl: siteUrl,
      }),
    }
  );

  const data = await response.json();
  const issues: { url: string; issue: string }[] = [];

  if (data.inspectionResult?.indexStatusResult?.verdict !== "PASS") {
    issues.push({
      url: siteUrl,
      issue:
        data.inspectionResult?.indexStatusResult?.verdict || "Unknown issue",
    });
  }

  return issues;
}
