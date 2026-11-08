import { appendFile } from "node:fs/promises";
import { loadObsidianPosts } from "../src/lib/obsidian/metadata";

async function main() {
  const directory = process.env.CONTENT_DIR;
  if (!directory) throw new Error("CONTENT_DIR에 Drive 수집 결과 디렉터리를 지정하세요.");
  const posts = await loadObsidianPosts(directory);
  const message = `Obsidian 메타데이터 검증 완료: 공개 글 ${posts.length}개`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n## 메타데이터 검증\n\n${message}\n`);
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "메타데이터 검증 실패");
  process.exitCode = 1;
});
