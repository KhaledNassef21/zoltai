// scripts/post-instagram.ts

async function main() {
  console.log("📸 Creating Instagram carousel...");

  // ✅ تحقق من الـ Credentials
  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  console.log('🔑 Instagram User ID:', instagramUserId ? '✅ Exists' : '❌ Missing');
  console.log('🔑 Instagram Access Token:', instagramAccessToken ? '✅ Exists' : '❌ Missing');

  if (!instagramUserId || !instagramAccessToken) {
    throw new Error("Instagram credentials not configured");
  }

  // ✅ صور Unsplash حقيقية
  const imageUrls = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1677442135137-4cd0e49a0e92?w=1080&h=1080&fit=crop',
  ];

  console.log(`📋 Total images: ${imageUrls.length}`);

  // ✅ إنشاء Media Container لكل صورة
  const containerIds: string[] = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    console.log(`📤 Creating container ${i + 1}/${imageUrls.length}...`);
    console.log(`   Image URL: ${imageUrl}`);
    
    const containerUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      media_type: 'IMAGE',
      access_token: instagramAccessToken,
    });

    console.log(`   POST ${containerUrl}?${containerParams.toString().replace(instagramAccessToken, '***')}`);

    const containerResponse = await fetch(`${containerUrl}?${containerParams}`, { 
      method: "POST" 
    });

    const containerData = await containerResponse.json();
    console.log(`   Response Status: ${containerResponse.status} ${containerResponse.statusText}`);
    console.log(`   Response Body:`, JSON.stringify(containerData, null, 2));

    if (!containerResponse.ok) {
      throw new Error(
        `Failed to create media container ${i + 1}: ${containerResponse.statusText}\n` +
        `Error Details: ${JSON.stringify(containerData, null, 2)}`
      );
    }

    containerIds.push(containerData.id);
    console.log(`   ✅ Container ID: ${containerData.id}`);
  }

  console.log(`\n📦 All containers created: ${containerIds.length}`);

  // ✅ إنشاء Carousel
  console.log(`\n🔄 Creating carousel...`);
  const carouselUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
  const carouselParams = new URLSearchParams({
    media_type: 'carousel',
    children: containerIds.join(','),
    access_token: instagramAccessToken,
  });

  console.log(`   POST ${carouselUrl}?${carouselParams.toString().replace(instagramAccessToken, '***')}`);

  const carouselResponse = await fetch(`${carouselUrl}?${carouselParams}`, { 
    method: "POST" 
  });

  const carouselData = await carouselResponse.json();
  console.log(`   Response Status: ${carouselResponse.status} ${carouselResponse.statusText}`);
  console.log(`   Response Body:`, JSON.stringify(carouselData, null, 2));

  if (!carouselResponse.ok) {
    throw new Error(`Failed to create carousel: ${carouselResponse.statusText}`);
  }

  const creationId = carouselData.id;
  console.log(`   ✅ Creation ID: ${creationId}`);

  // ✅ نشر البوست
  console.log(`\n📢 Publishing post...`);
  const publishUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: instagramAccessToken,
  });

  const publishResponse = await fetch(`${publishUrl}?${publishParams}`, { 
    method: "POST" 
  });

  const publishData = await publishResponse.json();
  console.log(`   Response Status: ${publishResponse.status} ${publishResponse.statusText}`);
  console.log(`   Response Body:`, JSON.stringify(publishData, null, 2));

  if (!publishResponse.ok) {
    throw new Error(`Failed to publish: ${publishResponse.statusText}`);
  }

  console.log("\n✅ Instagram post published successfully!");
  console.log("🔗 Post ID:", publishData.id);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
