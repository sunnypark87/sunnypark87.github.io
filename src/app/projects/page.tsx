import type { Metadata } from "next";
import Link from "next/link";

import { getPublishedProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "여러 지식과 Article을 하나의 문제 해결 흐름으로 연결한 프로젝트입니다.",
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  return (
    <main className="content-page" id="main-content">
      <p className="content-eyebrow">PROJECTS</p>
      <h1>Projects</h1>
      <p className="content-intro">여러 지식과 Article을 하나의 문제 해결 흐름으로 연결하는 공간입니다.</p>
      {projects.length > 0 ? (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.slug}>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <small>{project.status} · {project.updatedAt ?? project.startedAt}</small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>아직 공개된 프로젝트가 없습니다. 프로젝트 주제가 구체화되면 관련 문제 해결 기록을 이곳에 연결합니다.</p>
          <Link href="/articles/">현재 Article 살펴보기</Link>
        </div>
      )}
    </main>
  );
}
