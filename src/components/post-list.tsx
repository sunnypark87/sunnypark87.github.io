import Link from "next/link";
import type { SitePost } from "@/lib/obsidian/prepare";

export function PostList({ posts }: { posts: SitePost[] }) {
  if (!posts.length) return <p className="empty-state">아직 공개된 글이 없습니다.</p>;
  return <ul className="post-list">{posts.map(({ metadata: post }) => (
    <li key={post.slug}>
      <h2><Link href={`/posts/${post.slug}/`}>{post.title}</Link></h2>
      <time dateTime={post.published}>{post.published}</time>
      <p>{post.description}</p>
      {post.tags.length > 0 && <p className="post-tags">{post.tags.join(' · ')}</p>}
    </li>
  ))}</ul>;
}
