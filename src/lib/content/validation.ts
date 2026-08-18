import { getAllArticles } from "./articles";
import { getAllProjects } from "./projects";
import type { Article, Project } from "./types";

export async function validateContent() {
  const [articles, projects] = await Promise.all([getAllArticles(), getAllProjects()]);
  const errors = validateRelationships(articles, projects);
  if (errors.length) throw new Error(`Content relationship validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return { articles, projects };
}

type ReferenceArticle = Pick<Article, "slug" | "sourcePath" | "draft" | "project" | "prerequisites" | "relatedArticles" | "nextSteps">;
type ReferenceProject = Pick<Project, "slug" | "draft">;

export function validateRelationships(articles: ReferenceArticle[], projects: ReferenceProject[]) {
  const articleSlugs = new Set(articles.map((article) => article.slug));
  const projectSlugs = new Set(projects.map((project) => project.slug));
  const errors: string[] = [];

  for (const article of articles) {
    if (article.project && !projectSlugs.has(article.project)) errors.push(`${article.sourcePath}: unknown project "${article.project}"`);
    const project = projects.find((candidate) => candidate.slug === article.project);
    if (!article.draft && project?.draft) errors.push(`${article.sourcePath}: published article references draft project "${project.slug}"`);
    for (const relation of [...article.prerequisites, ...article.relatedArticles, ...article.nextSteps]) {
      if (!articleSlugs.has(relation)) errors.push(`${article.sourcePath}: unknown article "${relation}"`);
      if (relation === article.slug) errors.push(`${article.sourcePath}: cannot reference itself`);
      const target = articles.find((candidate) => candidate.slug === relation);
      if (!article.draft && target?.draft) errors.push(`${article.sourcePath}: published article references draft "${relation}"`);
    }
  }
  return errors;
}
