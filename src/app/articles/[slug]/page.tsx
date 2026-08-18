import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleBySlug, getPublishedArticles } from "@/lib/content";

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return article && !article.draft ? { title: article.title, description: article.description } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || (article.draft && process.env.NODE_ENV === "production")) notFound();
  return (
    <main className="article-page">
      <header className="article-header">
        <p className="content-eyebrow">{article.category} · {article.status}</p>
        <h1>{article.title}</h1>
        <p className="content-intro">{article.description}</p>
        <small>{article.publishedAt} · {article.readingTimeMinutes} min read</small>
      </header>
      <article className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />
    </main>
  );
}
