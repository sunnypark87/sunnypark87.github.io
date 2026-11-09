import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header"><nav aria-label="주요 메뉴">
    <Link href="/">Littlebread Lab</Link>
    <Link href="/posts/">글 목록</Link>
  </nav></header>;
}
