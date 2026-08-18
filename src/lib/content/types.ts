import type { z } from "zod";

import type { articleFrontmatterSchema, projectFrontmatterSchema } from "./schemas";

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;

export type Heading = { depth: number; id: string; text: string };

export type Article = ArticleFrontmatter & {
  slug: string;
  sourcePath: string;
  content: string;
  html: string;
  headings: Heading[];
  readingTimeMinutes: number;
  wordCount: number;
};

export type Project = ProjectFrontmatter & {
  slug: string;
  sourcePath: string;
  content: string;
  html: string;
  headings: Heading[];
  articles: Article[];
};
