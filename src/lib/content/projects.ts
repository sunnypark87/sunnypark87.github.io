import { getArticlesByProject } from "./articles";
import { loadProjects } from "./filesystem";

export async function getAllProjects() { return (await loadProjects()).sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.slug.localeCompare(b.slug)); }
export async function getPublishedProjects() { return (await getAllProjects()).filter((project) => !project.draft); }
export async function getProjectBySlug(slug: string) { return (await getAllProjects()).find((project) => project.slug === slug); }
export async function getProjectWithArticles(slug: string) {
  const project = await getProjectBySlug(slug);
  return project ? { ...project, articles: await getArticlesByProject(slug) } : undefined;
}
