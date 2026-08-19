---
title: "Markdown 글 사이의 관계를 탐색 흐름으로 연결하기"
description: "콘텐츠 메타데이터의 관계를 실제 다음 읽기 행동으로 연결하는 과정을 기록합니다."
publishedAt: "2026-08-19"
updatedAt: "2026-08-19"
status: "exploring"
category: "development"
topics:
  - markdown
  - content-model
project: null
prerequisites:
  - content-pipeline-fixture
relatedArticles: []
nextSteps: []
draft: false
---

## 문제

Article 메타데이터에 관련 글을 적어두는 것만으로는 지식의 연결이 독자의 다음 행동으로 이어지지 않습니다.

## 판단

전체 Knowledge Graph를 먼저 만들기보다, 실제 관계가 있는 글만 본문 끝에서 연결하기로 했습니다. 이렇게 하면 읽기 흐름을 유지하면서도 다음 탐색 경로를 제공합니다.

## 구현

관계 필드는 slug로 저장하고 빌드 시점에 공개 Article로 해석합니다.

```ts
const nextArticle = article.nextSteps.map((slug) => articlesBySlug.get(slug));
```

## 검증

관계가 없는 글에는 연결 섹션을 표시하지 않고, 관계가 있는 글에는 관계의 의미와 함께 제목·설명을 제공합니다.

## 한계와 다음 단계

Project가 생기면 Article과 Project의 연결도 같은 원칙으로 확장합니다.
