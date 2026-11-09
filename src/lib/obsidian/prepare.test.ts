import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareSiteContent } from "./prepare";

const roots: string[] = [];
async function setup() {
  const root = await mkdtemp(join(tmpdir(), "publish-test-")); roots.push(root);
  const input = join(root, "input"); const project = join(root, "project");
  await mkdir(join(input, "posts"), { recursive: true });
  await mkdir(join(input, "assets"));
  await mkdir(project);
  return { input, project };
}
const post = (body: string, slug = "test", published = "2026-11-08") => `---\ntitle: Test\ncreated: 2026-01-01\npublished: ${published}\ndescription: Test description\nslug: ${slug}\n---\n${body}`;
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

describe("site publication preparation", () => {
  it("copies only referenced assets, preserves source, and removes stale posts/assets on the next run", async () => {
    const { input, project } = await setup();
    await writeFile(join(input, "posts/test.md"), post("![[assets/photo.png]]"));
    await writeFile(join(input, "assets/photo.png"), "image bytes");
    await writeFile(join(input, "assets/private.txt"), "unused");
    expect(await prepareSiteContent(input, project)).toEqual({ posts: 1, assets: 1 });
    expect(await readdir(join(project, "public/assets"))).toEqual(["photo.png"]);
    expect(await readFile(join(project, "public/assets/photo.png"), "utf8")).toBe("image bytes");
    const data = JSON.parse(await readFile(join(project, ".content/site/content.json"), "utf8"));
    expect(data.posts[0].html).toContain('/assets/photo.png');
    expect(data.posts[0]).not.toHaveProperty("body");
    expect(data.posts[0]).not.toHaveProperty("sourcePath");
    await rm(join(input, "posts/test.md"));
    expect(await prepareSiteContent(input, project)).toEqual({ posts: 0, assets: 0 });
    expect(await readdir(join(project, "public/assets"))).toEqual([]);
    expect(JSON.parse(await readFile(join(project, ".content/site/content.json"), "utf8")).posts).toEqual([]);
    expect(await readFile(join(input, "assets/private.txt"), "utf8")).toBe("unused");
  });
  it("fails validation without replacing the last valid generated data", async () => {
    const { input, project } = await setup();
    await writeFile(join(input, "posts/test.md"), post("valid"));
    await prepareSiteContent(input, project);
    const previous = await readFile(join(project, ".content/site/content.json"), "utf8");
    await writeFile(join(input, "posts/test.md"), post("![[missing.png]]"));
    await expect(prepareSiteContent(input, project)).rejects.toThrow();
    expect(await readFile(join(project, ".content/site/content.json"), "utf8")).toBe(previous);
  });
  it("retains date/slug ordering and accepts future dates", async () => {
    const { input, project } = await setup();
    await writeFile(join(input, "posts/z.md"), post("Z", "z", "2099-01-01"));
    await writeFile(join(input, "posts/a.md"), post("A", "a", "2099-01-01"));
    await writeFile(join(input, "posts/old.md"), post("Old", "old"));
    await prepareSiteContent(input, project);
    const data = JSON.parse(await readFile(join(project, ".content/site/content.json"), "utf8"));
    expect(data.posts.map((p: { metadata: { slug: string } }) => p.metadata.slug)).toEqual(["a", "z", "old"]);
  });
  it("rejects overlapping input/output directories before modifying anything", async () => {
    const { project } = await setup();
    await expect(prepareSiteContent(project, project)).rejects.toThrow("겹칠");
    await expect(prepareSiteContent(join(project, "public/assets"), project)).rejects.toThrow("겹칠");
  });
});
