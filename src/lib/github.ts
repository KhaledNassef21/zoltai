/**
 * GitHub API utility for reading/writing files via GitHub Contents API.
 * This is essential for Vercel deployments where the filesystem is READ-ONLY.
 * All write operations (articles, tools, comments, users) go through GitHub API
 * which commits changes to the repo, triggering a Vercel redeploy.
 */

const REPO = process.env.GITHUB_REPO || "KhaledNassef21/zoltai";
const BRANCH = process.env.GITHUB_BRANCH || "main";

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  return token;
}

function apiUrl(path: string): string {
  return `https://api.github.com/repos/${REPO}/contents/${path}`;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

/**
 * Read a file from GitHub repo
 */
export async function readFile(
  filePath: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const res = await fetch(`${apiUrl(filePath)}?ref=${BRANCH}`, {
      headers: headers(),
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub read failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, sha: data.sha };
  } catch (err) {
    if ((err as Error).message?.includes("404")) return null;
    throw err;
  }
}

/**
 * Write (create or update) a file in GitHub repo
 */
export async function writeFile(
  filePath: string,
  content: string,
  message: string
): Promise<{ success: boolean; sha?: string }> {
  // First check if file exists to get SHA (needed for updates)
  const existing = await readFile(filePath);

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
  };

  if (existing) {
    body.sha = existing.sha;
  }

  const res = await fetch(apiUrl(filePath), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { success: true, sha: data.content?.sha };
}

/**
 * Delete a file from GitHub repo
 */
export async function deleteFile(
  filePath: string,
  message: string
): Promise<boolean> {
  const existing = await readFile(filePath);
  if (!existing) return false;

  const res = await fetch(apiUrl(filePath), {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify({
      message,
      sha: existing.sha,
      branch: BRANCH,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub delete failed (${res.status}): ${err}`);
  }

  return true;
}

/**
 * List files in a directory from GitHub repo
 */
export async function listFiles(
  dirPath: string
): Promise<{ name: string; path: string; sha: string; size: number }[]> {
  try {
    const res = await fetch(`${apiUrl(dirPath)}?ref=${BRANCH}`, {
      headers: headers(),
      cache: "no-store",
    });

    if (res.status === 404) return [];
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub list failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((item: any) => item.type === "file")
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
      }));
  } catch {
    return [];
  }
}

/**
 * Check if GitHub API is available (token is set)
 */
export function isGitHubAvailable(): boolean {
  return !!process.env.GITHUB_TOKEN;
}
