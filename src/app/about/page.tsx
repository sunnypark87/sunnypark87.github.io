import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Littlebread Lab이 지향하는 개발자상과 문제 해결 기록의 관점을 소개합니다.",
};

export default function AboutPage() {
  return (
    <main className="content-page about-page">
      <p className="content-eyebrow">ABOUT</p>
      <h1>About Littlebread Lab</h1>
      <p className="content-intro">지식을 문제에 맞게 연결하여 시스템을 구현하는 개발자의 성장 기록입니다.</p>

      <div className="prose-sections">
        <section>
          <h2>이 블로그의 목적</h2>
          <p>Littlebread Lab은 공부한 내용을 나열하는 공간이 아니라, 문제를 발견하고 필요한 지식을 연결해 실제 해결책으로 구현하는 과정을 기록합니다.</p>
        </section>
        <section>
          <h2>중요하게 생각하는 것</h2>
          <dl>
            <div><dt>Connection</dt><dd>서로 다른 지식을 문제에 맞게 연결합니다.</dd></div>
            <div><dt>Reasoning</dt><dd>선택한 기술과 방법의 이유를 설명합니다.</dd></div>
            <div><dt>Building</dt><dd>이해한 내용을 실제 결과물로 구현합니다.</dd></div>
          </dl>
        </section>
        <section>
          <h2>현재 관심 영역</h2>
          <p>현재는 퀀트를 공부하며 만나는 문제를 컴퓨터과학 지식과 개발 경험으로 풀어가는 과정을 기록하고 있습니다. 관심 영역은 콘텐츠가 쌓이면서 달라질 수 있습니다.</p>
        </section>
      </div>
    </main>
  );
}
