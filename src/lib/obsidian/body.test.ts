import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, symlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { renderObsidianContent, renderPost } from './body';
import { ReferenceResolver, BodyValidationError, assetUrl } from './references';
import type { ObsidianPost } from './metadata';

const post = (sourcePath: string, slug: string, body = '', cover?: string): ObsidianPost => ({ sourcePath, metadata: { title: slug, slug, created: '2026-11-08', published: '2026-11-08', description: 'test', tags: [], ...(cover ? { cover } : {}) }, body });
const first = post('posts/첫 글.md', 'first');
const second = post('posts/폴더/다음 글.md', 'second');
const asset = (sourcePath: string) => ({ sourcePath, url: assetUrl(sourcePath) });
const picture = asset('assets/first/테스트 이미지.png');
const render = (body: string, extra: ObsidianPost[] = [], files = [picture]) => renderPost({ ...first, body }, new ReferenceResolver([first, second, ...extra], files));
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

it('renders basic Markdown and GFM without rewriting examples in code', async () => {
  const result = await render('# 제목\n\n**강조**와 *기울임*\n\n- 항목\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n`[[다음 글]]`\n\n```js\n![[missing.png]]\n```');
  expect(result.html).toContain('<h1>제목</h1>'); expect(result.html).toContain('<strong>강조</strong>');
  expect(result.html).toContain('<table>'); expect(result.html).toContain('<code>[[다음 글]]</code>');
  expect(result.html).toContain('![[missing.png]]'); expect(result.linkedSlugs).toEqual([]);
});
it('connects published wiki targets and leaves unpublished aliases as text', async () => {
  const result = await render('[[다음 글|이어 읽기]] / [[posts/폴더/다음 글.md]] / [[drafts/초안|다음에 보기]]');
  expect(result.html).toContain('href="/posts/second/"');
  expect(result.html).toContain('class="post-link"'); expect(result.html).toContain('data-post-slug="second"');
  expect(result.html).toContain('이어 읽기</a>'); expect(result.html).toContain('다음에 보기');
  expect(result.html).not.toContain('drafts/'); expect(result.linkedSlugs).toEqual(['second']);
});
it('reports ambiguous note names and accepts explicit paths', async () => {
  const extra = post('posts/다른폴더/다음 글.md', 'third');
  await expect(render('[[다음 글]]', [extra])).rejects.toThrow('공개 글이 여러 개');
  expect((await render('[[폴더/다음 글]]', [extra])).linkedSlugs).toEqual(['second']);
});
it('converts standard and reference-style Markdown links with rich labels', async () => {
  const result = await render('[**다음**](폴더/다음%20글.md) [초안](../drafts/a.md) [다음][ref]\n\n[ref]: 폴더/다음%20글.md\n\n[공식](https://example.com)');
  expect(result.html).toContain('<strong>다음</strong></a>'); expect(result.html).toContain('href="https://example.com"');
  expect(result.html).not.toContain('drafts'); expect(result.linkedSlugs).toEqual(['second']);
});
it('resolves relative paths from nested posts and canonical Unicode filenames', async () => {
  const current = post('posts/deep/current.md', 'current', '[[../폴더/다음 글.md]]');
  const resolver = new ReferenceResolver([first, second, current], [picture]);
  expect((await renderPost(current, resolver)).linkedSlugs).toEqual(['second']);
  expect((await render('[[다음 글]]'.normalize('NFD'))).linkedSlugs).toEqual(['second']);
});
it('preserves escaped wikilinks and entity-encoded literal brackets', async () => {
  const result = await render('\\[[다음 글]] / &#91;&#91;다음 글]] / [[다음 글]]');
  expect(result.html.match(/data-post-slug/g)).toHaveLength(1);
});
it('resolves wiki, relative Markdown and reference images to encoded public paths', async () => {
  const result = await render('![[assets/first/테스트 이미지.png]]\n\n![설명](../assets/first/테스트%20이미지.png)\n\n![참조][img]\n\n[img]: ../assets/first/테스트%20이미지.png');
  expect(result.html.match(/<img /g)).toHaveLength(3); expect(result.html).toContain(`src="${picture.url}"`);
  expect(result.html).toContain('alt="설명"'); expect(result.assets).toEqual([picture]);
});
it('requires unique short image names, or an explicit assets path', async () => {
  const other = asset('assets/other/테스트 이미지.png');
  await expect(render('![[테스트 이미지.png]]', [], [picture, other])).rejects.toThrow('첨부 파일이 여러 개');
  expect((await render('![[assets/first/테스트 이미지.png]]', [], [picture, other])).assets).toEqual([picture]);
});
it('tracks cover-only images and file attachments without selecting unused assets', async () => {
  const pdf = asset('assets/first/manual.pdf');
  const unused = asset('assets/draft/private.png');
  const current = post(first.sourcePath, 'first', '[[assets/first/manual.pdf|자료]]', picture.sourcePath);
  const result = await renderPost(current, new ReferenceResolver([current], [picture, pdf, unused]));
  expect(result.coverUrl).toBe(picture.url); expect(result.assets).toHaveLength(2);
  expect(result.html).toContain('href="/assets/first/manual.pdf"'); expect(result.assets).not.toContainEqual(unused);
});
it('collects missing images, cover errors and traversal failures', async () => {
  const current = post(first.sourcePath, 'first', '![[missing.png]]\n\n![bad](../../outside.png)', 'assets/no-cover.png');
  try { await renderPost(current, new ReferenceResolver([current], [])); expect.fail('should fail'); }
  catch (error) {
    expect(error).toBeInstanceOf(BodyValidationError);
    const issues = (error as BodyValidationError).issues;
    expect(issues).toHaveLength(3); expect(issues.some((i) => i.field === 'cover')).toBe(true);
  }
});
it('renders callout kinds, rich titles, nested lists and unknown type fallback', async () => {
  const result = await render('> [!warning] **주의**\n> 첫 줄\n>\n> - 항목\n> - [[다음 글]]\n\n> [!custom] 참고\n> 내용\n\n> [!tip]\n> 팁 내용');
  expect(result.html).toContain('<aside class="callout" data-callout="warning">');
  expect(result.html).toContain('<p class="callout-title"><strong>주의</strong></p>');
  expect(result.html).toContain('<p>첫 줄</p>'); expect(result.html).toContain('<ul>');
  expect(result.html).toContain('data-callout="note"'); expect(result.html).toContain('data-callout="tip"');
  expect(result.html).toContain('팁 내용'); expect(result.html).not.toContain('[!');
});
it('keeps ordinary blockquotes and turns nested callouts into separate semantic elements', async () => {
  const result = await render('> 일반 인용\n\n> [!note] 외부\n>\n> > [!info] 내부\n> > 내용');
  expect(result.html).toContain('<blockquote>'); expect(result.html.match(/<aside/g)).toHaveLength(2);
});
it('does not execute raw HTML or inject markup through link labels or callout text', async () => {
  const result = await render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[[다음 글|<svg onload=alert(1)>]]\n\n> [!note] <script>x</script>\n> body');
  expect(result.html).not.toMatch(/<script|<img src="x"|<svg/);
});
it('rejects external images, unsafe URLs, note embeds and folding syntax explicitly', async () => {
  for (const body of ['![x](https://example.com/x.png)', '[x](javascript:alert)', '![[다음 글]]', '![[다음 글.md]]', '> [!note]- 접힘\n> 내용', '[[다음 글#제목]]']) {
    await expect(render(body)).rejects.toBeInstanceOf(BodyValidationError);
  }
});

describe('collected content integration', () => {
  async function setup() {
    const root = await mkdtemp(join(tmpdir(), 'obsidian-body-')); roots.push(root);
    await mkdir(join(root, 'posts')); await mkdir(join(root, 'assets'));
    const props = (slug: string) => `---\ntitle: Test\ncreated: 2026-11-08\npublished: 2026-11-08\ndescription: Test\nslug: ${slug}\n---\n`;
    await writeFile(join(root, 'posts/a.md'), props('a') + '![[x.png]]\n\n[[b|다음 글]]');
    await writeFile(join(root, 'posts/b.md'), props('b') + '> [!note] 참고\n> 테스트');
    await writeFile(join(root, 'assets/x.png'), 'fixture'); await writeFile(join(root, 'assets/unused.png'), 'private fixture');
    return root;
  }
  it('renders all posts, selects used files and leaves source files unchanged', async () => {
    const root = await setup();
    const before = await readFile(join(root, 'posts/a.md'), 'utf8');
    const result = await renderObsidianContent(root);
    expect(result.posts).toHaveLength(2); expect(result.assets.map((a) => a.sourcePath)).toEqual(['assets/x.png']);
    expect(result.posts[0].html).toContain('/posts/b/'); expect(await readFile(join(root, 'posts/a.md'), 'utf8')).toBe(before);
  });
  it('aggregates errors from separate posts', async () => {
    const root = await setup();
    await rm(join(root, 'assets/x.png'));
    const b = join(root, 'posts/b.md'); await writeFile(b, (await readFile(b, 'utf8')) + '\n![[missing.png]]');
    try { await renderObsidianContent(root); expect.fail('should fail'); }
    catch (error) { expect((error as BodyValidationError).issues.map((i) => i.file)).toEqual(['posts/a.md', 'posts/b.md']); }
  });
  it('rejects symlink assets and missing assets roots', async () => {
    const root = await setup();
    await symlink(join(root, 'posts/a.md'), join(root, 'assets/link.png'));
    await expect(renderObsidianContent(root)).rejects.toThrow('심볼릭 링크');
    await rm(join(root, 'assets'), { recursive: true });
    await expect(renderObsidianContent(root)).rejects.toThrow('assets');
  });
});
