import Link from "next/link";
import { PostList } from "@/components/post-list";
import { getSitePosts } from "@/lib/obsidian/site-content";

export default async function Home() {
  const posts = await getSitePosts();
  return <main className="posts-page" id="main-content">
    <header className="post-header"><h1>Littlebread Lab</h1><p>지식을 연결해 문제를 해결</p></header>
    <section aria-labelledby="recent-posts"><h2 id="recent-posts">최근 글</h2><PostList posts={posts.slice(0, 5)} /></section>
    <Link href="/posts/">전체 글 보기 →</Link>
  </main>;
}
