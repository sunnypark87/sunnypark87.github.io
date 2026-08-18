# Littlebread Lab 정보 구조

## 상태

**Initial structure — 2026-08-18**

이 문서는 현재 공개 범위에서 각 페이지가 맡는 역할과 URL을 정의한다. 구체적인 카드 형태, Sidebar, 모바일 내비게이션과 Article 최종 레이아웃은 별도 설계 대상으로 남긴다.

## 최상위 구조

```text
Home
├── Articles
│   └── Article detail
├── Projects
│   └── Project detail (콘텐츠가 생긴 뒤 확장)
└── About
```

### Home

브랜드와 현재 탐구 방향을 이해시키는 진입점이다.

- 대표 문구
- 핵심 설명
- 현재 관심 영역
- 최근 Article
- 공개 Project가 있을 때의 진입점

Home은 모든 콘텐츠를 담는 대시보드가 아니다.

### Articles

개별 문제 해결 기록을 탐색하는 공간이다.

- 공개 Article 목록
- 제목과 설명
- 게시일, 상태와 Category
- 필요한 경우 Topic과 연결된 Project

초기 정렬은 최신 `publishedAt` 순이며, Category와 Topic은 우선 메타데이터로 표현한다. 별도 URL 계층으로 고정하지 않는다.

### Projects

여러 Article과 결과물을 하나의 장기 문제 해결 흐름으로 연결한다. 아직 구체적인 프로젝트 주제는 정하지 않았으므로 데이터가 없을 때 안내 상태를 보여준다.

### About

개발자 지향점과 블로그의 관점을 설명한다.

- Connection, Reasoning, Building
- 문제 해결 과정을 기록하는 목적
- 현재 관심 영역인 Quant
- 작성자 소개와 외부 링크

## URL

```text
/                                Home
/articles/                       공개 Article 목록
/articles/<slug>/                Article 상세
/projects/                       공개 Project 목록 또는 빈 상태
/projects/<slug>/                Project 상세 (후속 확장)
/about/                          About
/404/                            찾을 수 없는 경로 안내
/rss.xml                         공개 Article RSS
/sitemap.xml                     공개 경로 Sitemap
/robots.txt                      크롤러 정책
```

Category와 Topic은 현재 URL에 포함하지 않는다. 분류 변경이 공개 Article URL을 깨뜨리지 않도록 하기 위함이다.

## 내비게이션

```text
Littlebread Lab  Articles  Projects  About
```

- 워드마크는 Home으로 연결한다.
- Home 워드마크와 현재 메뉴는 `aria-current`와 Slate Blue로 표현한다.
- Category를 최상위 메뉴로 올리지 않는다.
- 검색은 콘텐츠가 충분히 쌓인 뒤 별도 결정한다.

## 목록 정보 위계

Article은 다음 순서로 정보를 제공한다.

```text
Title → Description → Date/Status → Category/Topics → Project
```

Project는 다음 순서를 따른다.

```text
Title → Problem statement → Status → Updated date → Connected Articles
```

모든 정보를 반복적인 Badge나 카드 안에 넣지 않는다. 여백, 정렬, 타이포그래피와 얇은 구분선을 우선한다.

## 빈 상태

### Article이 없는 경우

현재 다루는 문제와 첫 글을 준비 중이라는 안내를 제공한다.

### Project가 없는 경우

프로젝트 주제가 구체화되면 문제 해결 기록을 연결한다는 안내를 제공한다. 임의의 퀀트 프로젝트를 생성하지 않는다.

## 공개 범위와 미결정 사항

현재 구현은 정보 구조 검증을 위한 최소 페이지다. 다음은 아직 확정하지 않는다.

- Article 목록의 최종 카드 또는 행 디자인
- Sidebar와 목차의 위치
- 모바일 내비게이션의 최종 형태
- Category/Topic 전용 탐색 페이지
- Project 상세 화면의 최종 구성
- 검색 UI와 다크 모드
