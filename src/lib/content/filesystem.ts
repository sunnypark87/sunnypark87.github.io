import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import readingTime from "reading-time";

import { renderMarkdown } from "./markdown";
import { articleFrontmatterSchema, projectFrontmatterSchema, slugSchema } from "./schemas";
import type { Article, Project } from "./types";

const root = process.cwd();

async function getContentDirectories(directory: string) {
  const absolute = path.join(root, directory);
  try {
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const slug of slugs) {
      const result = slugSchema.safeParse(slug);
      if (!result.success) throw new Error(`Invalid content directory: ${path.join(directory, slug)}\n- slug: ${result.error.issues[0].message}`);
    }
    return slugs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function loadArticles(): Promise<Article[]> {
  const slugs = await getContentDirectories("content/articles");
  return Promise.all(slugs.map(async (slug) => {
    const sourcePath = path.join("content/articles", slug, "index.md");
    const raw = await fs.readFile(path.join(root, sourcePath), "utf8");
    const file = matter(raw);
    const parsed = articleFrontmatterSchema.safeParse(file.data);
    if (!parsed.success) throw new Error(formatValidationError(sourcePath, parsed.error));
    const content = file.content.trim();
    const rendered = await renderMarkdown(content);
    const statistics = readingTime(content);
    return { ...parsed.data, slug, sourcePath, content, ...rendered, wordCount: statistics.words, readingTimeMinutes: Math.max(1, Math.ceil(statistics.minutes)) };
  }));
}

export async function loadProjects(): Promise<Project[]> {
  const slugs = await getContentDirectories("content/projects");
  return Promise.all(slugs.map(async (slug) => {
    const sourcePath = path.join("content/projects", slug, "index.md");
    const raw = await fs.readFile(path.join(root, sourcePath), "utf8");
    const file = matter(raw);
    const parsed = projectFrontmatterSchema.safeParse(file.data);
    if (!parsed.success) throw new Error(formatValidationError(sourcePath, parsed.error));
    const content = file.content.trim();
    const rendered = await renderMarkdown(content);
    return { ...parsed.data, slug, sourcePath, content, ...rendered, articles: [] };
  }));
}

function formatValidationError(sourcePath: string, error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const details = error.issues.map((issue) => `- ${issue.path.join(".") || "frontmatter"}: ${issue.message}`).join("\n");
  return `Invalid content: ${sourcePath}\n${details}`;
}
