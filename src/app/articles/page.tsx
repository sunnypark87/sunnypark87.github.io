import Link from "next/link";

import { getPublishedArticles } from "@/lib/content";

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();
  return (
    <main className="content-page">
      <p className="content-eyebrow">ARTICLES</p>
      <h1>Articles</h1>
      <p className="content-intro">문제를 발견하고, 지식을 연결하고, 결과를 검증한 기록입니다.</p>
      <ul className="article-list">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link href={`/articles/${article.slug}/`}>
              <span>{article.title}</span>
              <small>{article.category} · {article.publishedAt}</small>
            </Link>
            <p>{article.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
