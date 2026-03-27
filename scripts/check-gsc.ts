import { getSearchAnalytics, getIndexingIssues } from "../src/lib/search-console";

async function main() {
  console.log("🔍 Checking Google Search Console...");

  // Check indexing issues
  console.log("\n📋 Checking indexing status...");
  try {
    const issues = await getIndexingIssues();
    if (issues.length === 0) {
      console.log("✅ No indexing issues found!");
    } else {
      console.log(`⚠️ Found ${issues.length} issues:`);
      for (const issue of issues) {
        console.log(`  - ${issue.url}: ${issue.issue}`);
      }
    }
  } catch {
    console.log("⚠️ Could not check indexing (API may not be configured)");
  }

  // Get search performance
  console.log("\n📊 Search Performance (Last 28 days):");
  try {
    const analytics = await getSearchAnalytics(28);

    if (analytics.length === 0) {
      console.log("No search data available yet.");
      return;
    }

    // Total stats
    const totalClicks = analytics.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = analytics.reduce(
      (sum, row) => sum + row.impressions,
      0
    );
    const avgPosition =
      analytics.reduce((sum, row) => sum + row.position, 0) / analytics.length;

    console.log(`  Total clicks: ${totalClicks}`);
    console.log(`  Total impressions: ${totalImpressions}`);
    console.log(`  Average position: ${avgPosition.toFixed(1)}`);

    // Top performing queries
    console.log("\n🏆 Top Queries:");
    analytics
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .forEach((row, i) => {
        console.log(
          `  ${i + 1}. "${row.keys[0]}" — ${row.clicks} clicks, ${row.impressions} imp, pos ${row.position.toFixed(1)}`
        );
      });

    // Keywords with high impressions but low CTR (opportunities)
    console.log("\n💡 SEO Opportunities (high impressions, low CTR):");
    analytics
      .filter((row) => row.impressions > 50 && row.ctr < 0.03)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .forEach((row, i) => {
        console.log(
          `  ${i + 1}. "${row.keys[0]}" — ${row.impressions} imp, ${(row.ctr * 100).toFixed(1)}% CTR, pos ${row.position.toFixed(1)}`
        );
      });
  } catch {
    console.log("⚠️ Could not fetch search analytics");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
