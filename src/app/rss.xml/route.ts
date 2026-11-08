import { getSitePosts } from "@/lib/obsidian/site-content";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const articles = await getSitePosts();
  const items = articles.map(({ metadata: article }) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <description>${escapeXml(article.description)}</description>
      <link>${siteConfig.url}/posts/${article.slug}/</link>
      <guid>${siteConfig.url}/posts/${article.slug}/</guid>
      <pubDate>${new Date(`${article.published}T00:00:00+09:00`).toUTCString()}</pubDate>
    </item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>${items}
  </channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}
