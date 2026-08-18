import styles from "./page.module.css";
import Link from "next/link";

import { getPublishedArticles } from "@/lib/content";

export default async function Home() {
  const articles = await getPublishedArticles();
  const recentArticles = articles.slice(0, 3);
  return (
    <main className={styles.page}>
      <div className={styles.connection} aria-hidden="true">
        <span />
        <i />
        <span />
      </div>
      <p className={styles.eyebrow}>CONNECTED ENGINEERING NOTES</p>
      <h1>Littlebread Lab</h1>
      <p className={styles.tagline}>지식을 연결해 문제를 해결</p>
      <p className={styles.description}>
        지식을 문제에 맞게 연결하여 시스템을 구현하는 개발자의 성장 기록
      </p>
      <div className={styles.actions}>
        <Link href="/articles/">Articles 둘러보기</Link>
        <Link href="/about/">블로그 관점 읽기</Link>
      </div>

      <section className={styles.recent} aria-labelledby="recent-heading">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>RECENT NOTES</p>
          <h2 id="recent-heading">최근 기록</h2>
        </div>
        {recentArticles.length > 0 ? (
          <ul className={styles.articleList}>
            {recentArticles.map((article) => (
              <li key={article.slug}>
                <Link href={`/articles/${article.slug}/`}>{article.title}</Link>
                <span>{article.publishedAt} · {article.category}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>첫 번째 문제 해결 기록을 준비하고 있습니다.</p>
        )}
      </section>
    </main>
  );
}
