/**
 * Mock Image Generator - Free SVG-based placeholder images
 *
 * Generates blog cover images as SVGs without any external API.
 * Used as the default free image provider.
 */

export async function generateMockImage(title: string): Promise<string> {
  // Use a free placeholder service that doesn't require API keys
  // These services generate real images based on keywords
  const encodedTitle = encodeURIComponent(title.slice(0, 60));

  // Option 1: Use placehold.co (free, no API key)
  const width = 1792;
  const height = 1024;
  const bgColor = "0a0a0a";
  const textColor = "7c3aed";

  const url = `https://placehold.co/${width}x${height}/${bgColor}/${textColor}/png?text=${encodedTitle}`;

  // Verify the URL is reachable
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return url;
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: picsum.photos (random high-quality images, free)
  const seed = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
