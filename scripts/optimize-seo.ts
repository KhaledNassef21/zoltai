import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { optimizeForSEO } from "../src/lib/claude";

/**
 * Recursively strip undefined/null values from an object so js-yaml doesn't
 * crash with "unacceptable kind of an object to dump [object Undefined]".
 * This is the root cause of the YAML crash: when an AI provider returns a
 * JSON object with a missing field, the spread leaves it as undefined, and
 * gray-matter's yaml dumper can't serialize undefined.
 */
function sanitizeFrontmatter<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const cleaned = value.filter((v) => v !== undefined && v !== null);
      if (cleaned.length > 0) out[key] = cleaned;
      continue;
    }
    if (typeof value === "object" && !(value instanceof Date)) {
      out[key] = sanitizeFrontmatter(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out as T;
}

/**
 * Validate that the AI optimization response has all required fields
 * with non-empty values. If anything is missing, skip the article instead
 * of corrupting its frontmatter.
 */
function isValidOptimization(opt: unknown): opt is {
  title: string;
  description: string;
  content: string;
  keywords: string[];
} {
  if (!opt || typeof opt !== "object") return false;
  const o = opt as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    o.title.trim().length > 0 &&
    typeof o.description === "string" &&
    o.description.trim().length > 0 &&
    typeof o.content === "string" &&
    o.content.trim().length > 100 && // must be substantive, not empty/truncated
    Array.isArray(o.keywords)
  );
}

async function main() {
  const contentDir = path.join(process.cwd(), "src/content/blog");

  if (!fs.existsSync(contentDir)) {
    console.log("⚠️ No content directory found");
    process.exit(0);
  }

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  if (files.length === 0) {
    console.log("⚠️ No articles found");
    process.exit(0);
  }

  let optimizedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Skip if already optimized recently (check for seoOptimized flag)
    if (data.seoOptimized) {
      const optimizedDate = new Date(data.seoOptimized);
      const daysSinceOptimized =
        (Date.now() - optimizedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceOptimized < 7) {
        console.log(
          `⏭️ Skipping ${file} (optimized ${Math.floor(daysSinceOptimized)} days ago)`
        );
        continue;
      }
    }

    console.log(`🔍 Optimizing: ${data.title}`);

    // Each article runs in its own try/catch so one bad response doesn't
    // kill the entire daily run.
    try {
      const optimized = await optimizeForSEO(content, data.title);

      // Validate the response has all required fields. The AI can sometimes
      // return a partial object (missing content, empty arrays, etc.) and
      // blindly writing that corrupts the article.
      if (!isValidOptimization(optimized)) {
        console.warn(
          `   ⚠️ Skipping — incomplete AI response (missing required fields)`
        );
        console.warn(
          `      Got keys: [${Object.keys(optimized || {}).join(", ")}]`
        );
        failedCount++;
        continue;
      }

      // Build new frontmatter, then sanitize to drop any accidental undefined
      // values that would crash the YAML dumper.
      const updatedData = sanitizeFrontmatter({
        ...data,
        title: optimized.title,
        description: optimized.description,
        keywords: optimized.keywords,
        seoOptimized: new Date().toISOString().split("T")[0],
      });

      // Rebuild MDX file
      const updatedContent = matter.stringify(optimized.content, updatedData);
      fs.writeFileSync(filePath, updatedContent);

      console.log(`✅ Optimized: ${optimized.title}`);
      optimizedCount++;
    } catch (err) {
      // AI provider down, rate-limit, parse failure, etc. — log and move on.
      console.warn(
        `   ⚠️ Skipping — ${(err as Error).message?.slice(0, 120) || String(err)}`
      );
      failedCount++;
    }

    // Rate limiting - wait between API calls
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(
    `\n📊 Optimized: ${optimizedCount} / Skipped: ${skippedCount} / Failed: ${failedCount} / Total: ${files.length}`
  );

  // Exit 0 even when some articles failed — partial success is still success
  // for a daily cron job. The GitHub Actions run stays green.
  process.exit(0);
}

main().catch((err) => {
  // Only hard-fail when the script itself blows up (e.g., no content dir,
  // missing env vars) — not when individual articles fail.
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
