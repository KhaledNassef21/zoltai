// src/lib/image-provider.ts
import { generateImageWithPollinations } from "./pollinations-image";
import { generateCoverImage as openaiCoverImage } from "./openai-image";

export type ImageProvider = "pollinations" | "openai";

function getProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (env === "openai") return "openai";
  return "pollinations"; // Default to free option
}

async function generateWithPollinations(
  title: string,
  description: string
): Promise<string> {
  const prompt = `Modern blog cover image for: ${title}. ${description}. Minimalist, tech-focused, dark theme with purple and cyan accent colors. No text in image.`;
  return generateImageWithPollinations(prompt);
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
  pollinations: generateWithPollinations,
  openai: generateWithOpenAI,
};

const fallbackOrder: Record<ImageProvider, ImageProvider[]> = {
  pollinations: ["pollinations", "openai"],
  openai: ["openai", "pollinations"],
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
