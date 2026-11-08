import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderObsidianContent } from "../src/lib/obsidian/body";

async function main() {
  const directory = process.env.CONTENT_DIR;
  if (!directory) throw new Error("CONTENT_DIR에 Drive 수집 결과 디렉터리를 지정하세요.");
  const content = await renderObsidianContent(directory);
  const base = resolve('.content');
  await mkdir(base, { recursive: true });
  const output = await mkdtemp(join(base, 'render-'));
  try {
    await writeFile(join(output, 'content.json'), JSON.stringify({
      posts: content.posts.map(({ sourcePath, metadata, html, coverUrl, linkedSlugs, assets }) => ({ sourcePath, metadata, html, coverUrl, linkedSlugs, assets })),
      assets: content.assets,
    }, null, 2));
  } catch (error) { await rm(output, { recursive: true, force: true }); throw error; }
  const message = `본문 변환 완료: 공개 글 ${content.posts.length}개, 참조 첨부 파일 ${content.assets.length}개`;
  console.log(message);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `rendered_dir=${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n## 본문 변환\n\n${message}\n\n변환 결과는 임시 작업 공간에만 저장하며 배포하거나 업로드하지 않습니다.\n`);
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '본문 변환 실패');
  process.exitCode = 1;
});
