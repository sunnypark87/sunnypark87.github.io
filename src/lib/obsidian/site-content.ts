import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { SiteContent } from "./prepare";

export async function getSitePosts() {
  const content: SiteContent = JSON.parse(await readFile(resolve(".content/site/content.json"), "utf8"));
  return content.posts;
}
