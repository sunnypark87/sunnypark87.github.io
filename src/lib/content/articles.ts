import { loadArticles } from "./filesystem";
import type { Article } from "./types";
import type { ArticleCategory } from "./constants";

export type ArticleConnectionGroup = {
  key: "prerequisites" | "relatedArticles" | "nextSteps";
  label: string;
  articles: Article[];
};

export async function getAllArticles() { return (await loadArticles()).sort(sortByDate); }
export async function getPublishedArticles() { return (await getAllArticles()).filter((article) => !article.draft); }
export async function getArticleBySlug(slug: string) { return (await getAllArticles()).find((article) => article.slug === slug); }
export async function getArticlesByCategory(category: ArticleCategory) { return (await getPublishedArticles()).filter((article) => article.category === category); }
export async function getArticlesByProject(project: string) { return (await getPublishedArticles()).filter((article) => article.project === project); }

export async function getArticleConnections(article: Article): Promise<ArticleConnectionGroup[]> {
  const articles = await getPublishedArticles();
  return buildArticleConnections(article, articles);
}

export function buildArticleConnections(article: Article, articles: Article[]): ArticleConnectionGroup[] {
  const bySlug = new Map(articles.map((candidate) => [candidate.slug, candidate]));
  const groups = [
    { key: "prerequisites" as const, label: "먼저 읽으면 좋은 글" },
    { key: "relatedArticles" as const, label: "관련 글" },
    { key: "nextSteps" as const, label: "다음 단계" },
  ];
  return groups
    .map((group) => ({ ...group, articles: article[group.key].map((slug) => bySlug.get(slug)).filter((candidate): candidate is Article => Boolean(candidate)) }))
    .filter((group) => group.articles.length > 0);
}

function sortByDate(a: Article, b: Article) {
  return b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug);
}
