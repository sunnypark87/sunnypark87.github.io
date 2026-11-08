import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/post-body";
import { getSitePosts } from "@/lib/obsidian/site-content";

export const dynamicParams = false;
export const dynamic = "force-static";
type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  const params = (await getSitePosts()).map(({ metadata }) => ({ slug: metadata.slug }));
  // Next static export requires one parameter even for an empty collection.
  // This value cannot pass our slug validation and renders only notFound().
  return params.length ? params : [{ slug: "__empty" }];
}
async function getPost(params: Props['params']) {
  const { slug } = await params;
  const post = (await getSitePosts()).find((post) => post.metadata.slug === slug);
  if (!post) notFound();
  return post;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metadata: post, coverUrl } = await getPost(params);
  return { title: post.title, description: post.description, alternates: { canonical: `/posts/${post.slug}/` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: `${post.published}T00:00:00+09:00`, ...(coverUrl ? { images: [coverUrl] } : {}) } };
}
export default async function PostPage({ params }: Props) {
  const { metadata: post, html, coverUrl } = await getPost(params);
  return <main className="posts-page" id="main-content">
    <Link href="/posts/">← 글 목록</Link>
    <article>
      <header className="post-header">
        <h1>{post.title}</h1><p>{post.description}</p>
        <dl className="post-dates">
          <div><dt>작성</dt><dd><time dateTime={post.created}>{post.created}</time></dd></div>
          <div><dt>발행</dt><dd><time dateTime={post.published}>{post.published}</time></dd></div>
          {post.updated && <div><dt>수정</dt><dd><time dateTime={post.updated}>{post.updated}</time></dd></div>}
        </dl>
        {post.tags.length > 0 && <p className="post-tags">{post.tags.join(' · ')}</p>}
        {/* Local files keep their original dimensions; CSS constrains display width. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {coverUrl && <img className="post-cover" src={coverUrl} alt={`${post.title} 대표 이미지`} />}
      </header>
      <PostBody html={html} />
    </article>
  </main>;
}
