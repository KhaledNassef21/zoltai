/**
 * Mock Image Generator - Free placeholder images
 *
 * Generates blog cover images using free services.
 * Used as the default free image provider.
 *
 * For blog covers: uses picsum.photos with deterministic seeds
 * so the same title always gets the same image.
 */

export async function generateMockImage(title: string): Promise<string> {
  const width = 1792;
  const height = 1024;

  // Generate a deterministic seed from the title
  const seed = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  // picsum.photos - high quality stock photos, free, no API key
  // Use seed for deterministic images
  const picsumUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

  // Resolve the redirect to get the direct URL
  try {
    const response = await fetch(picsumUrl, { redirect: "follow" });
    if (response.ok) {
      return response.url; // Returns the direct fastly.picsum.photos URL
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: placehold.co with title text
  const encodedTitle = encodeURIComponent(title.slice(0, 40));
  return `https://placehold.co/${width}x${height}/0a0a0a/7c3aed/png?text=${encodedTitle}`;
}
