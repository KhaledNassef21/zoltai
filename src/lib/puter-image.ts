/**
 * Puter.js Image Generation
 *
 * Free image generation using Puter.js API.
 * Used as a cost-free alternative to OpenAI DALL-E.
 *
 * Puter.js text-to-image API:
 * POST https://api.puter.com/drivers/call
 * Driver: puter-image-generation
 * Method: generate
 */

const PUTER_API_URL = "https://api.puter.com/drivers/call";

export async function generateImageWithPuter(
  prompt: string
): Promise<string> {
  const apiKey = process.env.PUTER_API_KEY;

  if (!apiKey) {
    throw new Error("PUTER_API_KEY not configured");
  }

  const response = await fetch(PUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      interface: "puter-image-generation",
      driver: "openai-image-generation",
      method: "generate",
      args: {
        prompt,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Puter image generation failed: ${response.status} - ${errorText}`);
  }

  // Puter returns the image as base64 or a URL depending on the driver
  const data = await response.json();

  if (data.result?.url) {
    return data.result.url;
  }

  if (data.result?.base64) {
    // Return as data URL
    return `data:image/png;base64,${data.result.base64}`;
  }

  // Some drivers return image directly
  if (typeof data === "string" && data.startsWith("http")) {
    return data;
  }

  throw new Error("Unexpected response format from Puter image API");
}
