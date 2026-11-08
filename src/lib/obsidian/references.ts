import { lstat, readdir } from "node:fs/promises";
import { posix, resolve } from "node:path";
import type { ObsidianPost } from "./metadata";

export type ContentIssue = { file: string; field: string; message: string };
export class BodyValidationError extends Error {
  constructor(public readonly issues: ContentIssue[]) {
    super(issues.map(({ file, field, message }) => `${JSON.stringify(file)} [${field}]: ${message}`).join("\n"));
    this.name = "BodyValidationError";
  }
}
export type Asset = { sourcePath: string; url: string };
export const assetUrl = (path: string) => '/' + path.split('/').map(encodeURIComponent).join('/');
const key = (path: string) => path.normalize('NFC');
const imageExtension = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;

export async function listAssets(contentDirectory: string): Promise<Asset[]> {
  const root = resolve(contentDirectory, 'assets');
  const assets: Asset[] = [];
  const issues: ContentIssue[] = [];
  async function walk(path: string, relative: string) {
    const entries = await readdir(path, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : 1);
    for (const entry of entries) {
      const sourcePath = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) issues.push({ file: sourcePath, field: 'file', message: '심볼릭 링크는 지원하지 않습니다.' });
      else if (entry.isDirectory()) await walk(resolve(path, entry.name), sourcePath);
      else if (entry.isFile()) assets.push({ sourcePath, url: assetUrl(sourcePath) });
    }
  }
  try {
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('not a directory');
    await walk(root, 'assets');
  } catch {
    issues.push({ file: 'assets', field: 'file', message: '수집된 assets 폴더를 읽을 수 없습니다.' });
  }
  if (issues.length) throw new BodyValidationError(issues);
  return assets;
}

/** Paths are resolved against the collected vault, never the host filesystem. */
export class ReferenceResolver {
  constructor(private posts: ObsidianPost[], private assets: Asset[]) {}

  private path(target: string, sourcePath: string): { path: string; basenameOnly: boolean } {
    if (!target || /[\\\x00-\x1f\x7f]/.test(target) || /^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) {
      throw new Error('로컬 파일 경로가 필요합니다.');
    }
    const basenameOnly = !target.includes('/');
    const root = target.startsWith('/') ? target.slice(1) : target;
    const path = posix.normalize(target.startsWith('./') || target.startsWith('../') ? posix.join(posix.dirname(sourcePath), target) : root);
    if (path === '..' || path.startsWith('../') || path.startsWith('/')) throw new Error('보관함 밖의 경로를 참조할 수 없습니다.');
    return { path, basenameOnly };
  }

  post(target: string, sourcePath: string): ObsidianPost | undefined {
    if (/[#?]/.test(target)) throw new Error('글의 제목·블록 부분 링크는 아직 지원하지 않습니다. 글 파일을 연결하세요.');
    const { path, basenameOnly } = this.path(target, sourcePath);
    const strip = (s: string) => s.replace(/\.md$/i, '');
    const candidates = this.posts.filter((post) => {
      if (basenameOnly) return key(strip(posix.basename(post.sourcePath))) === key(strip(path));
      const expected = path.startsWith('posts/') || path.startsWith('drafts/') || path.startsWith('templates/') ? path : `posts/${path}`;
      return key(strip(post.sourcePath)) === key(strip(expected));
    });
    if (candidates.length > 1) throw new Error('같은 이름의 공개 글이 여러 개입니다. posts 기준 파일 경로를 명시하세요.');
    return candidates[0];
  }

  asset(target: string, sourcePath: string, image: boolean): Asset {
    const { path, basenameOnly } = this.path(target, sourcePath);
    const candidates = this.assets.filter((asset) => basenameOnly
      ? key(posix.basename(asset.sourcePath)) === key(path)
      : key(asset.sourcePath) === key(path));
    if (!basenameOnly && !path.startsWith('assets/')) throw new Error('첨부 자료는 assets 안의 파일만 참조할 수 있습니다.');
    if (candidates.length > 1) throw new Error('같은 이름의 첨부 파일이 여러 개입니다. assets 기준 경로를 명시하세요.');
    if (!candidates.length) throw new Error('참조한 첨부 파일을 assets에서 찾을 수 없습니다.');
    if (image && !imageExtension.test(candidates[0].sourcePath)) throw new Error('지원하는 이미지 파일이 아닙니다. 노트·기타 파일 임베드는 지원하지 않습니다.');
    return candidates[0];
  }
}
