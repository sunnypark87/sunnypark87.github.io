import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "문제를 정의하고 지식을 연결해 해결책을 구현한 과정과 결과를 소개합니다.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const projects = [
  {
    title: "UFO — 뜨개질 커뮤니티",
    period: "2026.01 — 2026.07 · Frontend Developer",
    summary:
      "도안 탐색과 대체 실 추천, 도안 기반 실시간 채팅을 하나의 흐름으로 연결한 뜨개질 커뮤니티 서비스입니다.",
    problem:
      "동시 401 응답에서 토큰 갱신이 중복되고, 같은 도안이 여러 화면에서 서로 다르게 보이며, WebSocket 재연결 시 구독이 중복될 수 있었습니다.",
    reasoning:
      "HTTP 요청과 WebSocket이 하나의 인증 수명주기를 공유하도록 구성하고, 서버 상태의 출처와 연결·구독의 생명주기를 각각 명확하게 관리했습니다.",
    result:
      "Single Refresh Coordinator로 토큰 갱신을 직렬화하고, Query Key와 Cache Update 전략으로 화면 간 데이터를 동기화했습니다. 재연결 시 구독 상태를 초기화하고 필요한 채팅방만 다시 구독하도록 구현했습니다.",
    technologies: ["Next.js", "TypeScript", "TanStack Query", "STOMP WebSocket"],
    links: [
      { label: "Repository", href: "https://github.com/Un-Finished-Object/ufo-fe" },
      { label: "Service", href: "https://www.knit-ufo.co.kr" },
    ],
    publication: null,
  },
  {
    title: "Remote Attestation for micro-ROS",
    period: "2025.04 — 2025.10 · Embedded Software Developer",
    summary:
      "자원이 제한된 MCU 환경에서 micro-ROS 애플리케이션의 무결성을 확인하기 위해 원격 증명 기술을 적용한 캡스톤 프로젝트입니다.",
    problem:
      "저사양 MCU는 연산 능력과 메모리가 제한되어 기존의 TPM 기반 보안 기술을 적용하기 어렵고, micro-ROS의 통신 과정에도 별도의 무결성 검증이 필요했습니다.",
    reasoning:
      "micro-ROS Agent 통신 장애를 구성요소별로 분리해 추적하고, Google DICE의 함수 흐름과 의존성을 분석해 Zephyr 환경에 필요한 부분을 이식했습니다.",
    result:
      "DICE 기반 원격 증명 기능과 MPU 제어를 담당했습니다. 애플리케이션은 unprivileged mode로 실행하고, 펌웨어 해싱처럼 필요한 연산만 SVC를 통해 privileged 권한에서 수행하는 구조를 구현했습니다. 프로젝트 결과는 IEEE Access 게재 논문에 공동저자로 참여했습니다.",
    technologies: ["C", "Zephyr RTOS", "micro-ROS", "DICE", "MPU"],
    links: [
      { label: "Repository", href: "https://github.com/pnucse-capstone2025/Capstone-2025-team-38" },
    ],
    publication: {
      title: "SERA: Secure Micro XRCE-DDS Establishment With Remote Attestation for Micro-ROS",
      href: "https://doi.org/10.1109/ACCESS.2026.3655366",
    },
  },
  {
    title: "동아리마트 — 대학교 동아리 홍보 플랫폼",
    period: "2023.12 — 2024.03 · Backend & Infra Developer",
    summary:
      "부산대학교 학생이 교내 동아리와 모집 정보를 한곳에서 탐색하고, 동아리 관계자가 정보를 직접 관리할 수 있도록 만든 서비스입니다.",
    problem:
      "동아리 정보와 모집 공고가 여러 채널에 흩어져 있었고, 개발 과정에서는 데이터베이스 변경과 배포를 반복해서 수동 처리해야 했습니다.",
    reasoning:
      "사용자와 동아리의 관계를 중심으로 데이터 구조를 설계하고, 애플리케이션 빌드부터 데이터베이스 마이그레이션과 프로세스 재시작까지 하나의 배포 흐름으로 연결했습니다.",
    result:
      "로그인과 사용자 관련 API를 구현하고, GitHub Actions·S3·CodeDeploy·EC2를 연결한 CI/CD 파이프라인에 Prisma Migration과 PM2 재시작을 포함해 반복 배포를 자동화했습니다.",
    technologies: ["Next.js", "Node.js", "Prisma", "MySQL", "AWS", "GitHub Actions"],
    links: [
      { label: "Repository", href: "https://github.com/sunnypark87/dongarimart" },
      { label: "Service", href: "https://www.dongarimart.com/" },
    ],
    publication: null,
  }
];

const capabilities = [
  {
    title: "문제 구조화",
    description: "모호한 요구를 관찰 가능한 문제와 검증 가능한 목표로 바꿉니다.",
  },
  {
    title: "시스템 구현",
    description: "데이터 흐름과 실패 조건을 고려해 유지보수 가능한 소프트웨어로 구현합니다.",
  },
  {
    title: "판단과 검증",
    description: "기술 선택의 근거를 기록하고 테스트와 측정 결과로 가정을 확인합니다.",
  },
];

const techStacks = [
  {
    category: "Web",
    technologies: ["TypeScript", "React", "Next.js"],
  },
  {
    category: "Backend & Infra",
    technologies: ["Node.js", "Prisma", "MySQL", "AWS", "GitHub Actions"],
  },
  {
    category: "Systems",
    technologies: ["C", "Zephyr RTOS", "micro-ROS"],
  },
];

export default function PortfolioPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.hero}>
        <p className={styles.eyebrow}>PORTFOLIO</p>
        <h1>박재선</h1>
        <p className={styles.intro}>
          문제를 명확히 정의하고, 필요한 지식과 기술을 연결해 실제로 동작하는 시스템을 만듭니다.
          결과뿐 아니라 선택의 이유와 검증 과정까지 설명하는 것을 중요하게 생각합니다.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="profile-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>PROFILE</p>
          <h2 id="profile-heading">일하는 방식</h2>
        </div>
        <div className={styles.capabilities}>
          {capabilities.map((capability, index) => (
            <article key={capability.title}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.stackSection}`} aria-labelledby="stack-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>TECH STACK</p>
          <h2 id="stack-heading">기술 스택</h2>
        </div>
        <div className={styles.stackGroups}>
          {techStacks.map((stack) => (
            <article key={stack.category}>
              <h3>{stack.category}</h3>
              <ul aria-label={`${stack.category} 기술`}>
                {stack.technologies.map((technology) => <li key={technology}>{technology}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="projects-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>SELECTED WORK</p>
          <h2 id="projects-heading">대표 프로젝트</h2>
        </div>
        <div className={styles.projects}>
          {projects.map((project) => (
            <article className={styles.project} key={`${project.period}-${project.title}`}>
              <header>
                <p>{project.period}</p>
                <h3>{project.title}</h3>
                <p className={styles.projectSummary}>{project.summary}</p>
              </header>
              <dl>
                <div>
                  <dt>Problem</dt>
                  <dd>{project.problem}</dd>
                </div>
                <div>
                  <dt>Reasoning</dt>
                  <dd>{project.reasoning}</dd>
                </div>
                <div>
                  <dt>Building &amp; Result</dt>
                  <dd>{project.result}</dd>
                </div>
                {project.publication ? (
                  <div>
                    <dt>Publication</dt>
                    <dd className={styles.publication}>
                      <a href={project.publication.href} rel="noreferrer" target="_blank">
                        <cite>{project.publication.title}</cite><span aria-hidden="true"> ↗</span>
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
              <ul className={styles.technologies} aria-label={`${project.title} 관련 기술`}>
                {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
              </ul>
              <div className={styles.projectLinks}>
                {project.links.map((link) => (
                  <a href={link.href} key={link.href} rel="noreferrer" target="_blank">
                    {link.label}<span aria-hidden="true"> ↗</span>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="experience-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>EXPERIENCE</p>
          <h2 id="experience-heading">대회 및 수상</h2>
        </div>
        <div className={styles.timeline}>
          <article>
            <p>2026.01.23 — 01.24</p>
            <div>
              <h3>2025학년도 PNU 지역 문제 해결 에듀테크 해커톤</h3>
              <p className={styles.meta}>최우수상 · 부산대학교 지역혁신역량교육연구센터</p>
              <p>
                커리어 목표에 맞는 AI 교과설계 서비스의 MVP를 정의하고 개발했습니다.
                제한된 시간 안에서 구현 우선순위를 조정하고 요구사항을 팀원들과 빠르게 공유해 결과물을 완성했습니다.
                짧은 개발 일정일수록 명확한 우선순위와 신속한 소통이 중요하다는 점을 배웠습니다.
              </p>
              <p className={styles.awardedAt}>수상일 2026.02.19</p>
            </div>
          </article>
          <article>
            <p>2025.03.11 — 10.01</p>
            <div>
              <h3>캡스톤디자인(졸업과제) · 하드웨어 보안분과</h3>
              <p className={styles.meta}>은상 · 부산대학교 정보컴퓨터공학부</p>
              <p>
                마이크로컨트롤러 기반 로봇 환경에 원격 증명 기술을 적용했습니다.
                Google Open-DICE를 Zephyr 환경에 그대로 적용하기 어렵다고 판단해 적합한 라이브러리를 활용하여 포팅하고,
                DICE 실행 과정의 메모리 접근을 통제하기 위해 MPU를 학습하고 적용했습니다.
              </p>
              <p className={styles.awardedAt}>수상일 2025.10.01</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="education-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>EDUCATION</p>
          <h2 id="education-heading">학력</h2>
        </div>
        <div className={styles.timeline}>
          <article>
            <p>2020.03 — 2026.08</p>
            <div>
              <h3>부산대학교</h3>
              <p className={styles.meta}>정보컴퓨터공학부 · 졸업</p>
            </div>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>CONTACT</p>
          <h2 id="contact-heading">연락처</h2>
        </div>
        <dl className={styles.contactList}>
          <div>
            <dt>Email</dt>
            <dd><a href="mailto:badawa7@naver.com">badawa7@naver.com</a></dd>
          </div>
          <div>
            <dt>GitHub</dt>
            <dd><a href="https://github.com/sunnypark87">sunnypark87</a></dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
