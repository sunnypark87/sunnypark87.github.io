import { copyFile, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { renderObsidianContent } from "./body";
import type { PostMetadata } from "./metadata";

export type SitePost = { metadata: PostMetadata; html: string; coverUrl?: string; linkedSlugs: string[] };
export type SiteContent = { posts: SitePost[] };

// These two generated paths are owned exclusively by this pipeline.
export async function prepareSiteContent(input: string, project = process.cwd()) {
  const source = resolve(input);
  const generated = resolve(project, ".content/site");
  const publicAssets = resolve(project, "public/assets");
  for (const output of [generated, publicAssets]) {
    const within = (a: string, b: string) => a === b || b.startsWith(a + sep);
    if (within(source, output) || within(output, source)) throw new Error("콘텐츠 입력과 생성 경로는 서로 겹칠 수 없습니다.");
  }
  // Validate everything before replacing any existing output.
  const content = await renderObsidianContent(source);
  await mkdir(join(project, ".content"), { recursive: true });
  const staging = await mkdtemp(join(project, ".content/prepare-"));
  try {
    await mkdir(join(staging, "assets"));
    await mkdir(join(staging, "site"));
    for (const asset of content.assets) {
      const file = relative("assets", asset.sourcePath);
      const destination = join(staging, "assets", file);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(source, asset.sourcePath), destination);
    }
    const data: SiteContent = {
      posts: content.posts.map(({ metadata, html, coverUrl, linkedSlugs }) => ({ metadata, html, coverUrl, linkedSlugs })),
    };
    await writeFile(join(staging, "site/content.json"), JSON.stringify(data));
    await mkdir(join(project, "public"), { recursive: true });
    await rm(publicAssets, { recursive: true, force: true });
    await rename(join(staging, "assets"), publicAssets);
    await rm(generated, { recursive: true, force: true });
    await rename(join(staging, "site"), generated);
    return { posts: data.posts.length, assets: content.assets.length };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
