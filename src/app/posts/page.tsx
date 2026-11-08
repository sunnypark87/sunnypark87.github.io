import type { Metadata } from "next";
import { PostList } from "@/components/post-list";
import { getSitePosts } from "@/lib/obsidian/site-content";

export const metadata: Metadata = { title: "글 목록", alternates: { canonical: "/posts/" } };
export default async function PostsPage() {
  return <main className="posts-page" id="main-content"><h1>글 목록</h1><PostList posts={await getSitePosts()} /></main>;
}
