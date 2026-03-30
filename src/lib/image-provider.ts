// src/lib/image-provider.ts
import { generateMockImage } from "./mock-image";
import { generateCoverImage as openaiCoverImage } from "./openai-image";

export type ImageProvider = "mock" | "openai";

function getProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (env === "openai") return "openai";
  return "mock"; // Default to mock (free & stable)
}

async function generateWithMock(
  title: string,
  description: string
): Promise<string> {
  return generateMockImage(title);
}

async function generateWithOpenAI(
  title: string,
  description: string
): Promise<string> {
  return openaiCoverImage(title, description);
}

const providers: Record<
  ImageProvider,
  (title: string, desc: string) => Promise<string>
> = {
  mock: generateWithMock,
  openai: generateWithOpenAI,
};

const fallbackOrder: Record<ImageProvider, ImageProvider[]> = {
  mock: ["mock", "openai"],
  openai: ["openai", "mock"],
};

export async function generateImage(
  title: string,
  description: string
): Promise<string> {
  const primary = getProvider();
  const chain = fallbackOrder[primary];

  for (const provider of chain) {
    try {
      console.log(`🎨 Trying image provider: ${provider}`);
      const url = await providers[provider](title, description);
      if (url) {
        console.log(`✅ Image generated with: ${provider}`);
        return url;
      }
    } catch (err) {
      console.warn(`⚠️ ${provider} failed:`, (err as Error).message);
    }
  }

  console.warn("⚠️ All image providers failed. Continuing without image.");
  return "";
}
