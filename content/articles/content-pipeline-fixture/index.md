---
title: "콘텐츠 파이프라인을 설계하며 배운 것"
description: "문제 해결 과정을 기록하기 위한 Markdown 콘텐츠 모델의 검증용 글입니다."
publishedAt: "2026-08-13"
updatedAt: "2026-08-13"
status: "building"
category: "development"
topics:
  - markdown
  - typescript
project: null
prerequisites: []
relatedArticles: []
nextSteps: []
draft: false
---

## 문제

콘텐츠를 코드와 분리하면서도 글과 지식의 관계를 잃지 않으려면 **검증 가능한 메타데이터**가 필요합니다.

## 선택한 구조

| 항목 | 선택 |
| --- | --- |
| 원본 | Markdown |
| 검증 | Zod |
| 배포 | 정적 HTML |

```ts
const content = "Connect knowledge";
console.log(content);
```

문서의 흐름은 다음과 같습니다.

1. 문제를 발견합니다.
2. 필요한 지식을 연결합니다.
3. 구현 결과를 검증합니다.

> 연결은 장식이 아니라 다음 판단으로 이동하는 근거입니다.

인라인 수식은 $E[X]$처럼 작성할 수 있고, 블록 수식도 지원합니다.

$$
R_t = \frac{P_t - P_{t-1}}{P_{t-1}}
$$
