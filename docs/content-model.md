# 콘텐츠 모델 가이드

## 문서 상태

**Accepted — 2026-08-18**

이 문서는 Littlebread Lab의 Markdown 콘텐츠 구조와 빌드 시 검증 규칙을 정의한다. Article의 최종 화면 레이아웃이나 Project의 구체적인 주제는 이 문서에서 확정하지 않는다.

## 콘텐츠 유형

### Article

하나의 문제, 학습 주제, 기술적 판단 또는 구현 결과를 다루는 독립적인 글이다. 가능한 경우 다음 사고 흐름을 보여준다.

```text
문제 또는 질문 → 필요한 지식 → 고려한 선택지 → 선택과 근거 → 구현 또는 적용 → 검증 → 한계와 다음 단계
```

이 흐름을 모든 글의 고정 목차로 강제하지는 않는다.

### Project

여러 Article과 결과물을 하나의 장기 작업 흐름으로 연결하는 상위 단위다. 첫 번째 퀀트 프로젝트의 주제는 아직 정하지 않았으므로 현재는 스키마와 연결 방식만 준비한다.

### Category와 Topic

Category는 글의 대표적인 넓은 영역이며 하나만 지정한다.

```text
quant | computer-science | development | problem-solving
```

Topic은 구체적인 지식이나 기술이며 여러 개를 지정할 수 있다. Rust 같은 도구는 Topic으로 다루며 최상위 브랜드 구조로 고정하지 않는다.

## 디렉터리와 URL

```text
content/
├── articles/<article-slug>/index.md
└── projects/<project-slug>/index.md
```

디렉터리 이름이 slug가 된다. Category를 URL에 넣지 않아 분류가 바뀌어도 공개 Article URL을 유지한다. 공개한 slug는 영구 식별자로 취급한다.

## Article front matter

```yaml
---
title: "글 제목"
description: "목록과 SEO에 사용할 요약"
publishedAt: "2026-08-18"
updatedAt: "2026-08-18"
status: "exploring"
category: "quant"
topics:
  - backtesting
project: null
prerequisites: []
relatedArticles: []
nextSteps: []
draft: true
---
```

필수 필드는 `title`, `description`, `publishedAt`, `status`, `category`이며 `draft` 기본값은 `false`다. 날짜는 `YYYY-MM-DD` 형식이고 `updatedAt`은 `publishedAt`보다 빠를 수 없다. `slug`, 읽는 시간, 단어 수와 목차는 빌드 시 계산하며 읽기 통계는 `reading-time`의 동일한 규칙을 사용한다.

## Project front matter

```yaml
---
title: "프로젝트 이름"
description: "프로젝트가 해결하려는 문제"
status: "exploring"
startedAt: "2026-08-18"
updatedAt: null
topics: []
repository: null
demo: null
draft: true
---
```

Project의 Article 목록은 Article의 `project` 값을 기준으로 자동 수집한다. 양쪽에 목록을 중복 작성하지 않는다.

## 상태와 Markdown 범위

상태는 `exploring`, `building`, `completed`를 사용한다. 게임화된 진행률로 변환하지 않는다.

현재 지원 범위는 기본 Markdown, GFM, 코드 블록, Shiki 기반 하이라이팅, KaTeX 수식, 제목 slug, 이미지, 링크와 인용문이다. 제목과 목차는 같은 GitHub slug 알고리즘을 사용한다. 임의 HTML과 MDX 컴포넌트는 허용하지 않는다.

### 이미지 저장 규칙

콘텐츠 이미지는 `public/articles/<article-slug>/`에 저장하고 Markdown에서는 사이트 루트 기준 경로로 참조한다.

```markdown
![이미지 설명](/articles/<article-slug>/<file-name>.webp)
```

현재는 `content/` 내부 이미지의 자동 복사 파이프라인을 제공하지 않는다. Markdown과 이미지를 같은 디렉터리에 배치하는 방식은 별도 요구가 생길 때 설계한다.

## 공개 및 검증 정책

- 개발 환경에서는 draft가 목록에 노출되지는 않지만 직접 URL로 읽을 수 있다.
- 프로덕션 목록과 `generateStaticParams()`에서는 `draft: false`만 포함한다.
- 공개 Article은 존재하지 않는 글, 자기 자신, draft 글 또는 draft Project를 관계 대상으로 참조할 수 없다.
- 잘못된 front matter나 관계는 `pnpm content:validate`와 `pnpm check`를 실패시킨다.

검증 대상은 필수 필드, 실제 달력 날짜와 날짜 순서, 허용된 상태·Category, 디렉터리 및 관계 slug 형식, 관계 배열 중복, Article·Project 참조와 자기 참조다. 콘텐츠 디렉터리가 없는 경우만 빈 컬렉션으로 취급하며 권한이나 파일 시스템 오류는 빌드를 실패시킨다.

## 글 작성 절차

1. `content/articles/<slug>/index.md`를 만든다.
2. front matter와 문제 해결 과정을 작성한다.
3. 초안이면 `draft: true`로 둔다.
4. `pnpm content:validate`와 `pnpm check`를 실행한다.
5. 공개할 때 `draft: false`로 변경한다.

현재 `content/articles/content-pipeline-fixture/`는 Markdown 파이프라인 검증용 예제이며 최종 블로그 콘텐츠나 Home 레이아웃의 확정 사항이 아니다.
