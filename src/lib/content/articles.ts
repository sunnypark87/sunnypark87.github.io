import { loadArticles } from "./filesystem";
import type { Article } from "./types";
import type { ArticleCategory } from "./constants";

export async function getAllArticles() { return (await loadArticles()).sort(sortByDate); }
export async function getPublishedArticles() { return (await getAllArticles()).filter((article) => !article.draft); }
export async function getArticleBySlug(slug: string) { return (await getAllArticles()).find((article) => article.slug === slug); }
export async function getArticlesByCategory(category: ArticleCategory) { return (await getPublishedArticles()).filter((article) => article.category === category); }
export async function getArticlesByProject(project: string) { return (await getPublishedArticles()).filter((article) => article.project === project); }

function sortByDate(a: Article, b: Article) {
  return b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug);
}
