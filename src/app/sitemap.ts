import type { MetadataRoute } from "next";

import { getPublishedArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();
  const staticPages = ["/", "/articles/", "/projects/", "/about/"];
  return [
    ...staticPages.map((path) => ({ url: `${siteConfig.url}${path}` })),
    ...articles.map((article) => ({
      url: `${siteConfig.url}/articles/${article.slug}/`,
      lastModified: article.updatedAt ?? article.publishedAt,
    })),
  ];
}
