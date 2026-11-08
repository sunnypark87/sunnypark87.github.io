import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "글 목록 안내", robots: { index: false }, alternates: { canonical: "/posts/" } };
export default function ArticlesPage() {
  return <main className="posts-page" id="main-content"><h1>글 목록</h1><p>새로 발행한 글은 글 목록에서 확인할 수 있습니다.</p><Link href="/posts/">글 목록으로 이동 →</Link></main>;
}
