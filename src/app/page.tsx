import { getAllPosts } from "@/lib/blog";
import { getFeaturedTools } from "@/data/tools";
import { HomeContent } from "./home-content";

export default function Home() {
  const posts = getAllPosts().slice(0, 6);
  const featured = getFeaturedTools().slice(0, 3);

  return <HomeContent posts={posts} featured={featured} />;
}
