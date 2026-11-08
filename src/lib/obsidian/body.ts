import { posix } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, RootContent, PhrasingContent, Text, Link, Image, Blockquote, Definition } from "mdast";
import { loadObsidianPosts, type ObsidianPost } from "./metadata";
import { BodyValidationError, listAssets, ReferenceResolver, type Asset, type ContentIssue } from "./references";

export type RenderedPost = ObsidianPost & { html: string; coverUrl?: string; assets: Asset[]; linkedSlugs: string[] };
export type RenderedContent = { posts: RenderedPost[]; assets: Asset[] };
const calloutTypes = new Set(['note', 'tip', 'info', 'warning', 'danger']);
const text = (value: string): Text => ({ type: 'text', value });
const schema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'aside'],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []).filter((rule) => !(Array.isArray(rule) && rule[0] === 'className')), ['className', 'data-footnote-backref', 'post-link'], 'dataPostSlug'],
    aside: [['className', 'callout'], ['dataCallout', 'note', 'tip', 'info', 'warning', 'danger']],
    p: [...(defaultSchema.attributes?.p ?? []), ['className', 'callout-title']],
  },
};

export async function renderPost(post: ObsidianPost, resolver: ReferenceResolver): Promise<RenderedPost> {
  const issues: ContentIssue[] = [];
  const used = new Map<string, Asset>();
  const linked = new Set<string>();
  const issue = (field: string, message: string) => issues.push({ file: post.sourcePath, field, message });
  function asset(target: string, image: boolean, field = 'body'): Asset | undefined {
    try {
      const found = resolver.asset(target, post.sourcePath, image);
      used.set(found.sourcePath, found);
      return found;
    } catch (error) { issue(field, (error as Error).message); }
  }
  function noteLink(target: string, children: PhrasingContent[]): PhrasingContent[] {
    try {
      const found = resolver.post(target, post.sourcePath);
      if (!found) return children;
      linked.add(found.metadata.slug);
      return [{ type: 'link', url: `/posts/${found.metadata.slug}/`, children, data: { hProperties: { className: ['post-link'], dataPostSlug: found.metadata.slug } } }];
    } catch (error) { issue('body', (error as Error).message); return children; }
  }
  function wiki(node: Text): PhrasingContent[] {
    const result: PhrasingContent[] = [];
    const pattern = /(!?)\[\[([^\]\n]+)\]\]/g;
    let cursor = 0;
    let rawCursor = 0;
    const raw = node.position ? post.body.slice(node.position.start.offset, node.position.end.offset) : node.value;
    for (const match of node.value.matchAll(pattern)) {
      const rawIndex = raw.indexOf(match[0], rawCursor);
      if (rawIndex < 0) continue; // Entity-encoded bracket examples stay literal.
      const slashes = /\\*$/.exec(raw.slice(0, rawIndex))?.[0].length ?? 0;
      rawCursor = rawIndex + match[0].length;
      if (slashes % 2) continue;
      result.push(text(node.value.slice(cursor, match.index)));
      const separator = match[2].indexOf('|');
      const target = (separator < 0 ? match[2] : match[2].slice(0, separator)).trim();
      const label = separator < 0 ? target : match[2].slice(separator + 1);
      if (match[1]) {
        if (/\.md(?:#|$)/i.test(target) || !posix.extname(target)) {
          issue('body', '노트 본문 임베드는 아직 지원하지 않습니다.');
        } else {
          const found = asset(target, true);
          if (found) result.push({ type: 'image', url: found.url, alt: label });
        }
      } else if (/\.[a-z\d]+$/i.test(target) && !/\.md$/i.test(target)) {
        const found = asset(target, false);
        if (found) result.push({ type: 'link', url: found.url, children: [text(label)] });
      } else {
        result.push(...noteLink(target, [text(label)]));
      }
      cursor = match.index + match[0].length;
    }
    result.push(text(node.value.slice(cursor)));
    return result.filter((node) => node.type !== 'text' || node.value !== '');
  }
  function decode(url: string): string | undefined {
    try { return decodeURIComponent(url); }
    catch { issue('body', '잘못된 URL 인코딩입니다. 파일 경로를 확인하세요.'); }
  }
  function markdownLink(node: Link): PhrasingContent[] {
    if (/^(https?:|mailto:)/i.test(node.url) || node.url.startsWith('#')) return [node];
    const target = decode(node.url);
    if (target === undefined) return node.children;
    if (/\.md(?:#|$)/i.test(target) || /^(?:\/?posts|\/?drafts|\/?templates)\//.test(target) || !posix.extname(target)) {
      return noteLink(target, node.children);
    }
    const found = asset(target, false);
    return found ? [{ ...node, url: found.url }] : node.children;
  }
  function markdownImage(node: Image): Image {
    const target = decode(node.url);
    const found = target === undefined ? undefined : asset(target, true);
    return { ...node, url: found?.url ?? '' };
  }
  function callout(node: Blockquote) {
    const first = node.children[0];
    if (first?.type !== 'paragraph' || first.children[0]?.type !== 'text') return;
    const marker = /^\[!([a-z\d_-]+)\]([+-]?)[ \t]*/i.exec(first.children[0].value);
    if (!marker) return;
    if (marker[2]) issue('body', '접기·펼치기 콜아웃은 아직 지원하지 않습니다. [!종류] 형식으로 작성하세요.');
    const kind = calloutTypes.has(marker[1].toLowerCase()) ? marker[1].toLowerCase() : 'note';
    const title: PhrasingContent[] = [];
    const rest: PhrasingContent[] = [];
    let inBody = false;
    const inline = first.children.map((child, index) => index === 0 ? text((child as Text).value.slice(marker[0].length)) : child);
    for (const child of inline) {
      if (!inBody && child.type === 'break') { inBody = true; continue; }
      if (!inBody && child.type === 'text' && child.value.includes('\n')) {
        const split = child.value.indexOf('\n');
        title.push(text(child.value.slice(0, split)));
        rest.push(text(child.value.slice(split + 1)));
        inBody = true;
      } else (inBody ? rest : title).push(child);
    }
    const hasTitle = title.some((child) => child.type !== 'text' || child.value.trim());
    node.data = { hName: 'aside', hProperties: { className: ['callout'], dataCallout: kind } };
    node.children = [
      { type: 'paragraph', data: { hProperties: { className: ['callout-title'] } }, children: hasTitle ? title : [text(kind)] },
      ...(rest.some((child) => child.type !== 'text' || child.value) ? [{ type: 'paragraph' as const, children: rest }] : []),
      ...node.children.slice(1),
    ];
  }
  const parser = unified().use(remarkParse).use(remarkGfm);
  const tree = parser.parse(post.body);
  const definitions = new Map<string, Definition>();
  const identifier = (s: string) => s.toLowerCase();
  function collect(node: Root | RootContent) {
    if (node.type === 'definition' && !definitions.has(identifier(node.identifier))) definitions.set(identifier(node.identifier), node);
    if ('children' in node) for (const child of node.children) collect(child as RootContent);
  }
  collect(tree);
  function transform(node: Root | RootContent, inLink = false): RootContent[] {
    if (node.type === 'code' || node.type === 'inlineCode' || node.type === 'html') return [node];
    if (node.type === 'text') return inLink ? [node] : wiki(node);
    if (node.type === 'blockquote') callout(node);
    if (node.type === 'linkReference' || node.type === 'imageReference') {
      const def = definitions.get(identifier(node.identifier));
      if (def) return transform(node.type === 'imageReference'
        ? { type: 'image', url: def.url, title: def.title, alt: node.alt }
        : { type: 'link', url: def.url, title: def.title, children: node.children }, inLink);
    }
    if ('children' in node) {
      // The transformation preserves block/inline placement; wiki output is always inline.
      node.children = node.children.flatMap((child) => transform(child as RootContent, inLink || node.type === 'link')) as typeof node.children;
    }
    if (node.type === 'image') return [markdownImage(node)];
    if (node.type === 'link') return markdownLink(node);
    return node.type === 'root' ? node.children : [node];
  }
  transform(tree);
  let coverUrl: string | undefined;
  if (post.metadata.cover) {
    const target = post.metadata.cover.replace(/^\[\[(.*)\]\]$/, '$1');
    coverUrl = asset(target, true, 'cover')?.url;
  }
  if (issues.length) throw new BodyValidationError(issues);
  const renderer = unified().use(remarkRehype, { allowDangerousHtml: false }).use(rehypeSanitize, schema).use(rehypeStringify);
  const htmlTree = await renderer.run(tree);
  return { ...post, html: renderer.stringify(htmlTree), ...(coverUrl ? { coverUrl } : {}), assets: [...used.values()].sort((a, b) => a.sourcePath < b.sourcePath ? -1 : 1), linkedSlugs: [...linked].sort() };
}

export async function renderObsidianContent(directory: string): Promise<RenderedContent> {
  const posts = await loadObsidianPosts(directory);
  const assets = await listAssets(directory);
  const resolver = new ReferenceResolver(posts, assets);
  const rendered: RenderedPost[] = [];
  const issues: ContentIssue[] = [];
  for (const post of posts) {
    try { rendered.push(await renderPost(post, resolver)); }
    catch (error) {
      if (error instanceof BodyValidationError) issues.push(...error.issues);
      else throw error;
    }
  }
  if (issues.length) throw new BodyValidationError(issues);
  const used = new Set(rendered.flatMap((post) => post.assets.map((asset) => asset.sourcePath)));
  return { posts: rendered, assets: assets.filter((asset) => used.has(asset.sourcePath)) };
}
