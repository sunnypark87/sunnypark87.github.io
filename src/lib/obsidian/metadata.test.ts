import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadObsidianPosts, MetadataValidationError, parsePost } from "./metadata";

const valid = `title: 블로그 연결 테스트
created: 2026-11-08
published: 2026-11-08
description: 연결 테스트입니다.
slug: blog-connection-test
tags:
  - 테스트
  - 블로그
cover: assets/blog-connection-test/test-image.png`;
const note = (properties = valid, body = "\n## 본문\n\n![[assets/test.png]]\n") => `---\n${properties}\n---\n${body}`;
const temps: string[] = [];
afterEach(async () => { await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });
async function workspace(files: Record<string, string>) {
  const dir = await mkdtemp(join(tmpdir(), "obsidian-metadata-")); temps.push(dir);
  await mkdir(join(dir, "posts"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, content);
  }
  return dir;
}

describe("Obsidian properties", () => {
  it("reads the agreed example, keeps dates as strings and preserves the raw body", () => {
    const body = "\n> [!note] 참고\n> 내용\n\n[[미공개 글|다음 글]]\n";
    const { post, issues } = parsePost(note(valid, body), "posts/테스트.md");
    expect(issues).toEqual([]);
    expect(post?.metadata).toEqual({ title: "블로그 연결 테스트", created: "2026-11-08", published: "2026-11-08", description: "연결 테스트입니다.", slug: "blog-connection-test", tags: ["테스트", "블로그"], cover: "assets/blog-connection-test/test-image.png" });
    expect(post?.body).toBe(body);
  });
  it("accepts BOM, CRLF, quoted dates and multiline descriptions", () => {
    const text = '\uFEFF' + note(valid.replace('created: 2026-11-08', 'created: "2026-11-08"').replace('description: 연결 테스트입니다.', 'description: >-\n  첫 줄\n  둘째 줄')).replaceAll('\n', '\r\n');
    expect(parsePost(text, 'posts/crlf.md').post?.metadata.description).toBe('첫 줄 둘째 줄');
  });
  it("allows future publication and an update before publication but after creation", () => {
    const result = parsePost(note(valid.replace('published: 2026-11-08', 'published: 2099-01-01') + '\nupdated: 2026-11-09'), 'posts/future.md');
    expect(result.issues).toEqual([]);
    expect(result.post?.metadata.published).toBe('2099-01-01');
  });
  it("treats empty optional properties as absent and permits unrelated Obsidian properties", () => {
    const props = valid.split('\ntags:')[0] + '\ntags:\ncover: ""\nupdated: null\naliases: [노트 별칭]\ndraft: true';
    const { post } = parsePost(note(props), 'posts/optional.md');
    expect(post?.metadata.tags).toEqual([]);
    expect(post?.metadata.cover).toBeUndefined();
    expect(post?.metadata.updated).toBeUndefined();
    expect(post?.metadata).not.toHaveProperty('draft');
  });
  it("collects missing, empty and wrong-type required properties without inventing defaults", () => {
    const result = parsePost(note('title: " "\nslug: 123\ndescription: true'), 'posts/bad.md');
    expect(result.post).toBeUndefined();
    expect(result.issues.map((i) => i.field).sort()).toEqual(['created', 'description', 'published', 'slug', 'title']);
  });
  it("validates real calendar dates and ordering without local timezone conversion", () => {
    for (const date of ['2026-02-29', '2026-02-31', '2026-13-01', '2026-1-01', '2026-11-08T12:00:00Z']) {
      expect(parsePost(note(valid.replace('created: 2026-11-08', `created: ${date}`)), 'posts/date.md').issues.some((i) => i.field === 'created')).toBe(true);
    }
    expect(parsePost(note(valid.replace('created: 2026-11-08', 'created: 2024-02-29')), 'posts/leap.md').issues).toEqual([]);
    const result = parsePost(note(valid + '\nupdated: 2026-11-07').replace('published: 2026-11-08', 'published: 2026-11-07'), 'posts/order.md');
    expect(result.issues.map((i) => i.field)).toEqual(['published', 'updated']);
  });
  it("rejects invalid slug and optional property types", () => {
    const props = valid.split('\ntags:')[0].replace('slug: blog-connection-test', 'slug: ../Other') + '\ntags: [123, ""]\ncover: [image.png]\nupdated: true';
    expect(parsePost(note(props), 'posts/types.md').issues.map((i) => i.field).sort()).toEqual(['cover', 'slug', 'tags', 'updated']);
  });
  it("rejects broken, duplicate, tagged or aliased YAML and absent delimiters", () => {
    for (const text of ['본문', '---\ntitle: title', note(valid + '\ntitle: duplicate'), note('title: ['), note('- list'), note(valid + '\nother: !!js/function function(){}'), note(valid + '\na: &x value\nb: *x')]) {
      const result = parsePost(text, 'posts/yaml.md');
      expect(result.post).toBeUndefined(); expect(result.issues[0]?.field).toBe('frontmatter');
    }
  });
});

describe("posts directory validation", () => {
  it("reads nested Markdown only and sorts by publication then slug, including future dates", async () => {
    const dir = await workspace({
      'posts/z.md': note(valid.replace('slug: blog-connection-test', 'slug: z')),
      'posts/nested/a.MD': note(valid.replace('slug: blog-connection-test', 'slug: a')),
      'posts/future.md': note(valid.replace('published: 2026-11-08', 'published: 2099-01-01').replace('slug: blog-connection-test', 'slug: future')),
      'posts/readme.txt': 'not Markdown', 'drafts/bad.md': 'invalid', 'templates/bad.md': 'invalid',
    });
    const posts = await loadObsidianPosts(dir);
    expect(posts.map((p) => p.metadata.slug)).toEqual(['future', 'a', 'z']);
    expect(posts[1].sourcePath).toBe('posts/nested/a.MD');
  });
  it("reports all files involved in duplicate slugs even when another field is invalid", async () => {
    const dir = await workspace({ 'posts/a.md': note(), 'posts/nested/b.md': note(valid.replace('title: 블로그 연결 테스트', 'title:')), 'posts/c.md': 'broken' });
    try { await loadObsidianPosts(dir); expect.fail('validation should fail'); }
    catch (error) {
      expect(error).toBeInstanceOf(MetadataValidationError);
      const issues = (error as MetadataValidationError).issues;
      expect(issues.filter((i) => i.field === 'slug').map((i) => i.file)).toEqual(['posts/a.md', 'posts/nested/b.md']);
      expect(issues.some((i) => i.file === 'posts/c.md')).toBe(true);
      expect(issues.some((i) => i.field === 'title')).toBe(true);
    }
  });
  it("allows an empty posts directory but fails for missing directories and symlinks", async () => {
    const dir = await workspace({});
    expect(await loadObsidianPosts(dir)).toEqual([]);
    await expect(loadObsidianPosts(join(dir, 'missing'))).rejects.toThrow('posts');
    await writeFile(join(dir, 'outside.md'), note());
    await symlink(join(dir, 'outside.md'), join(dir, 'posts/linked.md'));
    await expect(loadObsidianPosts(dir)).rejects.toThrow('심볼릭 링크');
  });
});
