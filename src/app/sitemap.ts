import type { MetadataRoute } from "next";

import { getSitePosts } from "@/lib/obsidian/site-content";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getSitePosts();
  const staticPages = ["/", "/posts/", "/projects/", "/about/"];
  return [
    ...staticPages.map((path) => ({ url: `${siteConfig.url}${path}` })),
    ...articles.map(({ metadata: article }) => ({
      url: `${siteConfig.url}/posts/${article.slug}/`,
      lastModified: article.updated ?? article.published,
    })),
  ];
}
