import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCoverImage(
  title: string,
  description: string
): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a modern, clean blog cover image for an article titled "${title}".
Description: ${description}.
Style: Minimalist, tech-focused, dark theme with purple and cyan accent colors.
No text in the image. Professional, suitable for a tech blog about AI.`,
    n: 1,
    size: "1792x1024",
    quality: "standard",
  });

  return response.data?.[0]?.url || "";
}

export async function generateInstagramSlides(
  title: string,
  keyPoints: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // Slide 1: Title slide
  const titleResponse = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a bold, eye-catching Instagram carousel title slide.
Topic: "${title}".
Style: Dark background (#0a0a0a), purple gradient accents, modern typography feel.
Clean and minimal. No actual text - just a visual representation of the topic.
Square format, 1080x1080.`,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });
  urls.push(titleResponse.data?.[0]?.url || "");

  // Content slides (max 3 to save API calls)
  for (const point of keyPoints.slice(0, 3)) {
    const slideResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a clean Instagram carousel content slide visual.
Key point: "${point}".
Style: Dark background, purple/cyan accents, tech/AI themed, abstract and modern.
No text. Square format.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    urls.push(slideResponse.data?.[0]?.url || "");
  }

  return urls;
}
