import Link from "next/link";
import type { Metadata } from "next";

import { getPublishedArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Articles",
  description: "문제를 발견하고 지식을 연결해 해결한 과정을 기록한 글입니다.",
};

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();
  return (
    <main className="content-page" id="main-content">
      <p className="content-eyebrow">ARTICLES</p>
      <h1>Articles</h1>
      <p className="content-intro">문제를 발견하고, 지식을 연결하고, 결과를 검증한 기록입니다.</p>
      {articles.length > 0 ? (
        <ul className="article-list">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}/`}>
                <span>{article.title}</span>
                <small>{article.status} · {article.category} · {article.publishedAt}</small>
              </Link>
              <p>{article.description}</p>
              {article.topics.length > 0 ? <small className="article-topics">{article.topics.join(" · ")}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">아직 공개된 글이 없습니다. 현재 퀀트를 공부하며 첫 번째 문제를 탐색하고 있습니다.</p>
      )}
    </main>
  );
}
