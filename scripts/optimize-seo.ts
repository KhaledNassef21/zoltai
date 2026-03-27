import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { optimizeForSEO } from "../src/lib/claude";

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
        console.log(`⏭️ Skipping ${file} (optimized ${Math.floor(daysSinceOptimized)} days ago)`);
        continue;
      }
    }

    console.log(`🔍 Optimizing: ${data.title}`);

    const optimized = await optimizeForSEO(content, data.title);

    // Update frontmatter
    const updatedData = {
      ...data,
      title: optimized.title,
      description: optimized.description,
      keywords: optimized.keywords,
      seoOptimized: new Date().toISOString().split("T")[0],
    };

    // Rebuild MDX file
    const updatedContent = matter.stringify(optimized.content, updatedData);
    fs.writeFileSync(filePath, updatedContent);

    console.log(`✅ Optimized: ${optimized.title}`);
    optimizedCount++;

    // Rate limiting - wait between API calls
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n📊 Total optimized: ${optimizedCount}/${files.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
