export const ARTICLE_CATEGORIES = [
  "quant",
  "computer-science",
  "development",
  "problem-solving",
] as const;

export const CONTENT_STATUSES = ["exploring", "building", "completed"] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_ROOT = "content";
export const ARTICLES_ROOT = `${CONTENT_ROOT}/articles`;
export const PROJECTS_ROOT = `${CONTENT_ROOT}/projects`;
