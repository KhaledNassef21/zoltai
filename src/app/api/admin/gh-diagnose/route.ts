import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";

/**
 * Diagnostic endpoint for troubleshooting GitHub token issues.
 * Returns the state of GITHUB_TOKEN as Vercel sees it RIGHT NOW.
 *
 * Calls out exactly why GitHub writes would fail:
 *   - Is the token present?
 *   - What type (classic ghp_ vs fine-grained github_pat_)?
 *   - Does it authenticate? (GET /user)
 *   - Does it have push access to the repo? (GET /repos/.../permissions)
 *   - Does it have required fine-grained permissions? (test write via dummy)
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "KhaledNassef21/zoltai";
  const branch = process.env.GITHUB_BRANCH || "main";

  const result: Record<string, unknown> = {
    tokenPresent: !!token,
    tokenPrefix: token ? token.slice(0, 11) + "..." : null,
    tokenLength: token?.length ?? 0,
    tokenType: !token
      ? "missing"
      : token.startsWith("github_pat_")
      ? "fine-grained"
      : token.startsWith("ghp_")
      ? "classic"
      : token.startsWith("gho_")
      ? "oauth"
      : "unknown",
    repo,
    branch,
    vercelEnv: process.env.VERCEL_ENV || "unknown",
    vercelGitCommitSha: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "unknown",
  };

  if (!token) {
    return NextResponse.json({ ...result, error: "GITHUB_TOKEN not set in Vercel env" });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  // Test 1: /user — does the token authenticate at all?
  try {
    const userRes = await fetch("https://api.github.com/user", { headers, cache: "no-store" });
    const userBody = await userRes.json().catch(() => ({}));
    result.userCheck = {
      status: userRes.status,
      ok: userRes.ok,
      login: userBody.login || null,
      message: userBody.message || null,
    };
  } catch (e) {
    result.userCheck = { error: (e as Error).message };
  }

  // Test 2: /repos/{repo} — can we even see the repo? what permissions?
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      cache: "no-store",
    });
    const repoBody = await repoRes.json().catch(() => ({}));
    result.repoCheck = {
      status: repoRes.status,
      ok: repoRes.ok,
      fullName: repoBody.full_name || null,
      permissions: repoBody.permissions || null, // { admin, push, pull }
      message: repoBody.message || null,
    };
  } catch (e) {
    result.repoCheck = { error: (e as Error).message };
  }

  // Test 3: attempt a write on a scratch file — reveals fine-grained permission state
  // We write a tiny throwaway file then delete it. Any non-200/201 response reveals the gap.
  try {
    const scratchPath = `.gh-diagnose-${Date.now()}.txt`;
    const putBody = {
      message: "chore: gh-diagnose scratch write (auto-deleted)",
      content: Buffer.from("diagnostic probe").toString("base64"),
      branch,
    };
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${scratchPath}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(putBody),
    });
    const putBodyResp = await putRes.json().catch(() => ({}));
    const writeResult: Record<string, unknown> = {
      status: putRes.status,
      ok: putRes.ok,
      message: putBodyResp.message || null,
    };

    // If it succeeded, delete the scratch file
    if (putRes.ok && putBodyResp.content?.sha) {
      const delRes = await fetch(
        `https://api.github.com/repos/${repo}/contents/${scratchPath}`,
        {
          method: "DELETE",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "chore: gh-diagnose cleanup",
            sha: putBodyResp.content.sha,
            branch,
          }),
        }
      );
      writeResult.cleanup = { status: delRes.status, ok: delRes.ok };
    }

    result.writeCheck = writeResult;
  } catch (e) {
    result.writeCheck = { error: (e as Error).message };
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
