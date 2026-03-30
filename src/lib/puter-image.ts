// src/lib/puter-image.ts
/**
 * Puter.js Image Generation - Free without API key
 */

export async function generateImageWithPuter(
  prompt: string
): Promise<string> {
  // Puter.js يعمل بدون API Key للاستخدام الأساسي
  const response = await fetch("https://api.puter.com/drivers/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      interface: "puter-image-generation",
      method: "txt2img",
      args: {
        prompt,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Puter image generation failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.result?.url) {
    return data.result.url;
  }

  if (data.result?.base64) {
    return `data:image/png;base64,${data.result.base64}`;
  }

  throw new Error("Unexpected response format from Puter image API");
}
