const INSTAGRAM_API_URL = "https://graph.facebook.com/v19.0";

interface InstagramConfig {
  accessToken: string;
  igUserId: string;
}

function getConfig(): InstagramConfig {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !igUserId) {
    throw new Error("Instagram API credentials not configured");
  }

  return { accessToken, igUserId };
}

async function createMediaContainer(
  imageUrl: string,
  caption: string,
  isCarouselItem: boolean = false
): Promise<string> {
  const { accessToken, igUserId } = getConfig();

  const params: Record<string, string> = {
    image_url: imageUrl,
    access_token: accessToken,
  };

  if (isCarouselItem) {
    params.is_carousel_item = "true";
  } else {
    params.caption = caption;
  }

  const response = await fetch(
    `${INSTAGRAM_API_URL}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }

  return data.id;
}

export async function publishCarousel(
  imageUrls: string[],
  caption: string
): Promise<string> {
  const { accessToken, igUserId } = getConfig();

  // Step 1: Create individual media containers
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const id = await createMediaContainer(url, "", true);
    childIds.push(id);
  }

  // Step 2: Create carousel container
  const carouselResponse = await fetch(
    `${INSTAGRAM_API_URL}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption,
        access_token: accessToken,
      }),
    }
  );

  const carouselData = await carouselResponse.json();
  if (carouselData.error) {
    throw new Error(`Instagram carousel error: ${carouselData.error.message}`);
  }

  // Step 3: Publish
  const publishResponse = await fetch(
    `${INSTAGRAM_API_URL}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carouselData.id,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();
  if (publishData.error) {
    throw new Error(`Instagram publish error: ${publishData.error.message}`);
  }

  return publishData.id;
}
