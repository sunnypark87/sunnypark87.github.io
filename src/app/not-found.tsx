import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <main className="content-page not-found-page" id="main-content">
      <p className="content-eyebrow">404 · NOT FOUND</p>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="content-intro">주소가 변경되었거나 존재하지 않는 페이지입니다.</p>
      <div className="not-found-links">
        <Link href="/">Home으로 이동</Link>
        <Link href="/articles/">Articles 둘러보기</Link>
      </div>
    </main>
  );
}
