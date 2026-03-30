import { NextRequest, NextResponse } from "next/server";

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const adminPassword = process.env.ADMIN_PASSWORD || "zoltai2026";
    return decoded.includes(adminPassword);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    // Trigger GitHub Actions workflow via API
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "KhaledNassef21/zoltai";

    if (!githubToken) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN not configured. Set it in environment variables." },
        { status: 500 }
      );
    }

    const workflowMap: Record<string, string> = {
      article: "daily-article.yml",
      instagram: "daily-instagram.yml",
      seo: "daily-seo.yml",
      email: "weekly-email.yml",
      gsc: "weekly-gsc-check.yml",
    };

    const workflowFile = workflowMap[action];
    if (!workflowFile) {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Valid: ${Object.keys(workflowMap).join(", ")}` },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: `Workflow "${action}" triggered successfully!`,
      });
    }

    const errorData = await response.text();
    return NextResponse.json(
      { error: `GitHub API error: ${response.status} - ${errorData}` },
      { status: response.status }
    );
  } catch {
    return NextResponse.json({ error: "Failed to trigger workflow" }, { status: 500 });
  }
}
