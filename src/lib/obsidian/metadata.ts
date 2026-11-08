import { lstat, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isMap, parseDocument } from "yaml";

export type MetadataIssue = { file: string; field: string; message: string };
export type PostMetadata = {
  title: string;
  created: string;
  published: string;
  updated?: string;
  description: string;
  slug: string;
  tags: string[];
  cover?: string;
};
export type ObsidianPost = { sourcePath: string; metadata: PostMetadata; body: string };
export class MetadataValidationError extends Error {
  constructor(public readonly issues: MetadataIssue[]) {
    super(issues.map(({ file, field, message }) => `${JSON.stringify(file)} [${field}]: ${message}`).join("\n"));
    this.name = "MetadataValidationError";
  }
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parsePost(source: string, sourcePath: string): { post?: ObsidianPost; issues: MetadataIssue[]; slug?: string } {
  const issues: MetadataIssue[] = [];
  const issue = (field: string, message: string) => issues.push({ file: sourcePath, field, message });
  // Only a YAML block at the start is metadata; preserve the Markdown body verbatim.
  const normalized = source.replace(/^\uFEFF/, "");
  const opening = /^---[ \t]*\r?\n/.exec(normalized);
  if (!opening) {
    issue("frontmatter", "파일 맨 위에 ---로 감싼 YAML 속성이 필요합니다.");
    return { issues };
  }
  const remainder = normalized.slice(opening[0].length);
  const closing = /^---[ \t]*(?:\r?\n|$)/m.exec(remainder);
  if (!closing) {
    issue("frontmatter", "YAML 속성을 닫는 ---가 없습니다.");
    return { issues };
  }
  const document = parseDocument(remainder.slice(0, closing.index), { version: "1.2", schema: "core", uniqueKeys: true, prettyErrors: false });
  if (document.errors.length || document.warnings.length) {
    for (const error of [...document.errors, ...document.warnings]) {
      // Report parser codes, not excerpts of user content or arbitrary YAML keys.
      issue("frontmatter", `YAML 문법을 확인하세요 (${error.code}).`);
    }
    return { issues };
  }
  if (!isMap(document.contents)) {
    issue("frontmatter", "속성은 이름과 값으로 이루어진 YAML 객체여야 합니다.");
    return { issues };
  }
  let values: Record<string, unknown>;
  try {
    values = document.toJS({ maxAliasCount: 0 });
  } catch {
    issue("frontmatter", "YAML 별칭 대신 속성 값을 직접 입력하세요.");
    return { issues };
  }
  const optional = (field: string) => {
    const value = Object.hasOwn(values, field) ? values[field] : undefined;
    return value == null || (typeof value === "string" && !value.trim()) ? undefined : value;
  };
  const requiredText = (field: string) => {
    const value = optional(field);
    if (typeof value !== "string") {
      issue(field, "비어 있지 않은 텍스트가 필요합니다.");
      return "";
    }
    return value.trim();
  };
  const title = requiredText("title");
  const description = requiredText("description");
  const slug = requiredText("slug");
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (slug && !validSlug) issue("slug", "영문 소문자·숫자를 하이픈으로 연결한 형식이어야 합니다.");
  const dateValue = (field: string, required: boolean) => {
    const value = optional(field);
    if (value === undefined && !required) return undefined;
    if (typeof value !== "string" || !isDate(value)) {
      issue(field, "YYYY-MM-DD 형식의 실제 달력 날짜가 필요합니다.");
      return undefined;
    }
    return value;
  };
  const created = dateValue("created", true);
  const published = dateValue("published", true);
  const updated = dateValue("updated", false);
  if (created && published && published < created) issue("published", "작성일(created)보다 빠를 수 없습니다.");
  if (created && updated && updated < created) issue("updated", "작성일(created)보다 빠를 수 없습니다.");
  const rawTags = optional("tags");
  let tags: string[] = [];
  if (rawTags !== undefined) {
    if (!Array.isArray(rawTags) || rawTags.some((tag) => typeof tag !== "string" || !tag.trim())) {
      issue("tags", "비어 있지 않은 텍스트의 목록이어야 합니다.");
    } else {
      tags = rawTags.map((tag: string) => tag.trim());
    }
  }
  const rawCover = optional("cover");
  let cover: string | undefined;
  if (rawCover !== undefined) {
    if (typeof rawCover !== "string") issue("cover", "이미지 경로를 텍스트로 입력하세요.");
    else cover = rawCover.trim();
  }
  const result = { issues, slug: validSlug ? slug : undefined };
  if (issues.length || !created || !published) return result;
  return {
    ...result,
    post: {
      sourcePath,
      metadata: { title, description, slug, created, published, ...(updated ? { updated } : {}), tags, ...(cover ? { cover } : {}) },
      body: remainder.slice(closing.index + closing[0].length),
    },
  };
}

export async function loadObsidianPosts(contentDirectory: string): Promise<ObsidianPost[]> {
  const postsDirectory = resolve(contentDirectory, "posts");
  const issues: MetadataIssue[] = [];
  const posts: ObsidianPost[] = [];
  const slugs = new Map<string, string[]>();
  const fail = (file: string, message: string) => issues.push({ file, field: "file", message });
  async function walk(directory: string, relative: string) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch { fail(relative, "폴더를 읽을 수 없습니다. 경로와 권한을 확인하세요."); return; }
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const file = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) { fail(file, "심볼릭 링크는 지원하지 않습니다."); continue; }
      if (entry.isDirectory()) { await walk(join(directory, entry.name), file); continue; }
      if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue;
      let source;
      try { source = await readFile(join(directory, entry.name), "utf8"); }
      catch { fail(file, "파일을 읽을 수 없습니다."); continue; }
      const result = parsePost(source, file);
      issues.push(...result.issues);
      if (result.slug) slugs.set(result.slug, [...(slugs.get(result.slug) ?? []), file]);
      if (result.post) posts.push(result.post);
    }
  }
  try {
    const root = await lstat(postsDirectory);
    if (!root.isDirectory() || root.isSymbolicLink()) fail("posts", "일반 폴더가 필요합니다.");
    else await walk(postsDirectory, "posts");
  } catch { fail("posts", "폴더를 찾을 수 없습니다. 수집 결과 경로를 확인하세요."); }
  for (const files of slugs.values()) {
    if (files.length < 2) continue;
    for (const file of files) issues.push({ file, field: "slug", message: "다른 공개 글과 중복됩니다. 중복 표시된 파일의 slug를 구분하세요." });
  }
  if (issues.length) throw new MetadataValidationError(issues);
  return posts.sort((a, b) => {
    if (a.metadata.published !== b.metadata.published) return a.metadata.published > b.metadata.published ? -1 : 1;
    return a.metadata.slug < b.metadata.slug ? -1 : a.metadata.slug > b.metadata.slug ? 1 : 0;
  });
}
