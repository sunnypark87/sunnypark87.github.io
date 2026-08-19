import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleBySlug, getArticleConnections, getPublishedArticles } from "@/lib/content";

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
  const connectionGroups = await getArticleConnections(article);
  return (
    <main className="article-page" id="main-content">
      <header className="article-header">
        <p className="content-eyebrow">{article.category} · {article.status}</p>
        <h1>{article.title}</h1>
        <p className="content-intro">{article.description}</p>
        <dl className="article-meta">
          <div><dt>게시</dt><dd><time dateTime={article.publishedAt}>{article.publishedAt}</time></dd></div>
          {article.updatedAt && article.updatedAt !== article.publishedAt ? <div><dt>수정</dt><dd><time dateTime={article.updatedAt}>{article.updatedAt}</time></dd></div> : null}
          <div><dt>읽는 시간</dt><dd>{article.readingTimeMinutes}분</dd></div>
        </dl>
        {article.topics.length > 0 ? <p className="article-topics">Topics · {article.topics.join(" · ")}</p> : null}
      </header>
      <article className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />
      {connectionGroups.length > 0 ? (
        <section className="article-connections" aria-labelledby="connections-heading">
          <h2 id="connections-heading">이어지는 연결</h2>
          {connectionGroups.map((group) => (
            <div className="article-connection-group" key={group.key}>
              <h3>{group.label}</h3>
              <ul>
                {group.articles.map((connectedArticle) => (
                  <li key={connectedArticle.slug}>
                    <Link href={`/articles/${connectedArticle.slug}/`}>{connectedArticle.title}</Link>
                    <p>{connectedArticle.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}
