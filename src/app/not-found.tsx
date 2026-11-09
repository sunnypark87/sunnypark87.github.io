import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };
export default function NotFound() {
  return <main className="posts-page" id="main-content"><h1>페이지를 찾을 수 없습니다</h1>
    <p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p>
    <Link href="/">홈</Link>{" · "}<Link href="/posts/">글 목록</Link>
  </main>;
}
