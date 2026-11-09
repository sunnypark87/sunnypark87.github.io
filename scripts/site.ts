import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { prepareSiteContent } from "../src/lib/obsidian/prepare";

async function main() {
  const mode = process.argv[2];
  if (!['dev', 'build', 'sample', 'prepare'].includes(mode)) throw new Error('실행 모드를 확인하세요.');
  const input = mode === 'sample' ? 'examples/obsidian' : process.env.CONTENT_DIR || (mode === 'dev' ? 'examples/obsidian' : undefined);
  if (!input) throw new Error('CONTENT_DIR이 필요합니다. 샘플 빌드는 pnpm build:sample을 사용하세요.');
  const counts = await prepareSiteContent(input);
  console.log(`공개 콘텐츠 준비 완료: 글 ${counts.posts}개, 첨부 ${counts.assets}개`);
  if (mode === 'prepare') return;
  const child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), mode === 'dev' ? 'dev' : 'build', ...process.argv.slice(3)], { stdio: 'inherit', env: process.env });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => child.kill(signal));
  child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '콘텐츠 준비 실패');
  process.exitCode = 1;
});
