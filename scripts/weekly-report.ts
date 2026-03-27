import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { sendWeeklyReport } from "../src/lib/resend-email";
import { getSearchAnalytics } from "../src/lib/search-console";

async function main() {
  console.log("📊 Generating weekly report...");

  const contentDir = path.join(process.cwd(), "src/content/blog");
  const files = fs.existsSync(contentDir)
    ? fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"))
    : [];

  // Count new posts this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const allPosts = files.map((file) => {
    const content = fs.readFileSync(path.join(contentDir, file), "utf-8");
    const { data } = matter(content);
    return {
      title: data.title,
      slug: file.replace(".mdx", ""),
      date: new Date(data.date),
    };
  });

  const newPosts = allPosts.filter((p) => p.date >= oneWeekAgo);

  // Get search analytics
  let seoInsights = "Search Console data not yet available.";
  try {
    const analytics = await getSearchAnalytics(7);
    if (analytics.length > 0) {
      const topQueries = analytics
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(
          (row) =>
            `"${row.keys[0]}" — ${row.clicks} clicks, pos ${row.position.toFixed(1)}`
        );
      seoInsights = `Top queries this week:\n${topQueries.join("\n")}`;
    }
  } catch {
    seoInsights = "Search Console not configured yet.";
  }

  // Send report
  await sendWeeklyReport({
    totalPosts: allPosts.length,
    newPostsThisWeek: newPosts.length,
    topPosts: allPosts
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5),
    seoInsights,
    instagramStats: "Check Instagram Insights for detailed analytics.",
    gscIssues: "Run GSC check workflow for detailed issues.",
  });

  console.log("✅ Weekly report sent!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
