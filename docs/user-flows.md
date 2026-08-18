# Littlebread Lab 핵심 사용자 흐름

## 상태

**Initial flows — 2026-08-18**

이 문서는 현재 정보 구조에서 검증할 최소 탐색 흐름을 정의한다. Knowledge Network는 별도 그래프 화면이 아니라 실제 콘텐츠 관계 링크로 먼저 표현한다.

## 흐름 1. 블로그 발견

```text
Home
→ 브랜드 메시지 이해
→ 현재 관심 영역 확인
→ 최근 Article 선택
```

검증 질문:

- 첫 화면에서 무엇을 기록하는 블로그인지 이해되는가?
- Rust 또는 특정 프로젝트 중심 블로그로 오해하지 않는가?
- 글이 적어도 브랜드 설명이 성립하는가?

## 흐름 2. Article 탐색

```text
Articles
→ 제목과 문제 설명 확인
→ Date/Status/Category 확인
→ Article 선택
```

목록은 최신 공개일 순으로 정렬한다. draft Article은 목록, Sitemap과 RSS에 포함하지 않는다.

## 흐름 3. 문제 해결 과정 읽기

```text
Article header
→ 문제와 배경
→ 선택지와 판단
→ 구현
→ 검증
→ 한계와 다음 단계
```

Article header는 제목, 설명, 게시일, 수정일, 읽는 시간, 상태, Category를 제공한다. 본문보다 메타데이터가 시각적으로 강해지지 않도록 한다.

## 흐름 4. 지식 연결 탐색

```text
Article
→ Prerequisites
→ Connected Project
→ Related Articles
→ Next Steps
```

관계가 실제로 존재할 때만 섹션을 표시한다.

- `Prerequisites`: 먼저 이해하면 좋은 글
- `Connected Project`: 이 글이 기여하는 상위 결과물
- `Related Articles`: 같은 문제나 개념에 관련된 글
- `Next Steps`: 이어지는 학습이나 구현

## 흐름 5. Project 탐색

```text
Projects
→ 해결하려는 문제 이해
→ 현재 상태 확인
→ 연결된 Article 탐색
→ 결과와 다음 단계 확인
```

Project가 없는 초기에는 빈 상태를 보여준다. 실제 프로젝트가 생기기 전까지 임의의 순서 필드를 추가하지 않는다.

## 접근성 및 반응형 검증

- 모든 내비게이션 링크는 키보드로 접근할 수 있어야 한다.
- 현재 경로는 색상만으로 표현하지 않는다.
- 모바일에서도 제목, 설명, 날짜와 링크 관계가 유지되어야 한다.
- 빈 상태는 색상이나 장식에 의존하지 않는다.
- 긴 제목과 긴 코드가 가로 화면을 깨뜨리지 않아야 한다.

## 보류

- 전체 Knowledge Graph
- 검색과 복잡한 필터
- 게임화된 진행률
- 최종 Sidebar/목차 위치
