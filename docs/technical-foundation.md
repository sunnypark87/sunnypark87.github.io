# 기술 기반 결정 기록

## 상태

**Accepted — 2026-08-12**

이 문서는 Littlebread Lab 구축 로드맵의 1단계인 기술 기반에 대한 확정 사항과 운영 제약을 기록한다.

## 결정 요약

| 영역 | 결정 |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript strict mode |
| Rendering | Static export (`output: "export"`) |
| Content source | 저장소 내부 Markdown |
| Markdown pipeline | `gray-matter` + remark/rehype 계열, 2단계에서 도입 |
| Schema validation | Zod, 2단계에서 도입 |
| Styling | CSS custom properties + CSS Modules |
| Package manager | pnpm |
| Runtime | Node.js 22 LTS |
| Deployment | GitHub Actions → GitHub Pages |
| Analytics | GA4 최소 구성 |
| Unit test | Vitest |
| Browser E2E | Playwright, 핵심 사용자 흐름 구현 시 도입 |

## 선택 이유

### Next.js + TypeScript

App Router의 정적 생성과 컴포넌트 구조를 활용하면서 콘텐츠 모델과 UI를 타입으로 검증할 수 있다. TypeScript는 `strict` 모드로 운영하여 콘텐츠 및 컴포넌트 경계의 오류를 조기에 발견한다.

### 정적 내보내기

GitHub Pages는 Node.js 애플리케이션 서버를 제공하지 않는다. 모든 공개 경로를 빌드 시점에 HTML, CSS와 JavaScript로 생성하고 `out/` 디렉터리를 배포한다.

따라서 다음 기능은 프로젝트 기반으로 사용하지 않는다.

- 요청 시점 서버 렌더링
- Server Actions
- Cookies와 요청 기반 Route Handler
- ISR와 Draft Mode
- 런타임 rewrite, redirect, header 설정
- 사전 생성하지 않은 동적 경로
- 기본 Next.js 이미지 최적화 서버

동적 Article 경로는 콘텐츠 목록을 읽어 `generateStaticParams()`로 모두 생성한다.

### 로컬 Markdown

콘텐츠를 코드와 함께 버전 관리하여 글의 수정 이력, 연결 관계와 빌드 재현성을 유지한다. 초기에는 일반 Markdown을 사용하고, 콘텐츠 안에 React 컴포넌트를 포함해야 하는 실제 요구가 생기기 전까지 MDX는 도입하지 않는다.

### CSS 기반 스타일링

브랜드 토큰은 CSS custom properties로 정의하고 컴포넌트별 스타일은 CSS Modules로 격리한다. UI 라이브러리를 먼저 도입하지 않으며, 필요한 구성 요소가 확인될 때 평가한다.

### GitHub Pages

이 저장소는 사용자 사이트 저장소 `sunnypark87.github.io`이므로 기본 배포 URL에서는 `basePath`가 필요하지 않다. 향후 저장소 이름이나 배포 위치가 바뀌면 `basePath`, asset 경로와 canonical URL을 함께 검토한다.

### GA4

페이지 조회, 인기 글, 유입 경로와 참여 정도를 확인하는 최소 분석 도구로 사용한다. 광고 전환이나 개인 식별 정보는 수집하지 않는다. 측정 ID는 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경 변수로 주입하며, 값이 없는 빌드에서는 분석 스크립트를 출력하지 않는다.

## 품질 명령

```text
pnpm dev        로컬 개발 서버
pnpm lint       ESLint 검사
pnpm typecheck  TypeScript 검사
pnpm test       Vitest 단위 테스트 1회 실행
pnpm build      Next.js 정적 빌드
pnpm check      위 네 가지 품질 검사를 순차 실행
pnpm start      out/ 로컬 정적 미리보기
```

## 버전 호환성 기록

- 기준 런타임은 CI와 `.nvmrc`에서 Node.js 22로 맞춘다.
- `pnpm-lock.yaml`을 배포와 로컬 재현성의 기준으로 사용한다.
- pnpm의 설치 스크립트는 기본적으로 허용하지 않으며, 필요한 패키지만 `pnpm-workspace.yaml`의 `onlyBuiltDependencies`에 명시한다. 현재 허용 대상은 Next.js ESLint resolver가 사용하는 `unrs-resolver`다.
- 2026-08-12 초기 구성 시 최신 TypeScript 7은 `eslint-config-next`에 포함된 typescript-eslint의 지원 범위와 맞지 않아 TypeScript 6.0 계열로 고정했다.
- 같은 시점의 일부 Next.js lint 플러그인이 ESLint 10을 지원하지 않아 ESLint 9 계열로 고정했다.
- 버전 범위를 올릴 때 경고를 무시하거나 peer dependency를 강제하지 말고 `pnpm check`가 경고 없이 통과하는 조합을 선택한다.

## 환경 변수

| 이름 | 공개 여부 | 필수 여부 | 용도 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 브라우저에 공개 | 선택 | GA4 Web stream 측정 ID |

`NEXT_PUBLIC_` 값은 비밀이 아니다. GitHub Actions에서는 Repository variable로 관리하며 secret이나 개인정보를 이 접두사의 환경 변수에 넣지 않는다.

## 정적 배포 제약 체크리스트

새 기능을 추가할 때 다음을 확인한다.

1. 요청 시점 서버 코드가 필요한가?
2. 모든 동적 URL을 빌드 시점에 알 수 있는가?
3. 브라우저 API 접근은 Client Component의 안전한 시점에 이루어지는가?
4. 이미지가 런타임 최적화 서버에 의존하지 않는가?
5. 외부 데이터가 빌드 실패나 재현성 저하를 유발하지 않는가?
6. 로컬 `pnpm build`로 실제 Pages 산출물을 검증했는가?

하나라도 정적 내보내기와 충돌하면 기능을 다시 설계하거나 호스팅 결정 자체를 별도 검토한다.

## 보류 결정

다음은 기술 기반의 일부로 확정하지 않는다.

- MDX 도입
- 검색 엔진 및 검색 UI
- CMS
- 다크 모드
- 이미지 CDN
- 자동 OG Image 생성
- 댓글
- 전체 Knowledge Graph
- Playwright의 구체적인 시나리오
