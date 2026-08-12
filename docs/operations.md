# Littlebread Lab 운영 가이드

## 목적

이 문서는 개발 환경, 품질 검사, 배포, 분석과 의존성 관리처럼 블로그를 지속적으로 운영하기 위해 유지해야 할 사항을 기록한다.

## 로컬 개발

### 요구 환경

- Node.js 22 LTS (`.nvmrc` 기준)
- pnpm (`package.json`의 `packageManager` 버전 기준)

저장소를 받은 뒤 다음 순서로 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

의존성을 변경하지 않는 일반 설치와 CI에서는 `pnpm install --frozen-lockfile`을 사용한다. 의존성을 추가하거나 갱신할 때는 `pnpm add`, `pnpm add -D` 또는 `pnpm update`를 사용하고 변경된 `package.json`과 `pnpm-lock.yaml`을 함께 커밋한다.

## 변경 전후 검증

PR이나 배포 전에는 다음 명령을 실행한다.

```bash
pnpm check
```

이 명령은 lint, typecheck, unit test와 production build를 검사한다. 정적 내보내기 관련 오류는 개발 서버에서 드러나지 않을 수 있으므로 `pnpm build`를 생략하지 않는다.

빌드 결과를 브라우저에서 확인하려면 다음을 사용한다.

```bash
pnpm build
pnpm start
```

`out/`은 생성 산출물이므로 커밋하지 않는다.

## 배포 운영

### PR

PR에서는 `.github/workflows/ci.yml`이 품질 검사를 실행한다. 모든 검사를 통과한 변경만 `main`에 병합한다.

### Production

`main`에 push하면 `.github/workflows/deploy.yml`이 다음 순서로 실행된다.

```text
checkout
→ pnpm과 Node.js 설정
→ pnpm install --frozen-lockfile
→ pnpm check
→ GitHub Pages 설정
→ out/ artifact 업로드
→ production 배포
```

GitHub 저장소의 **Settings → Pages → Build and deployment → Source**는 `GitHub Actions`로 설정되어 있어야 한다.

배포가 실패하면 다음 순서로 확인한다.

1. CI의 최초 실패 단계와 로그를 확인한다.
2. 같은 commit에서 로컬 `pnpm install --frozen-lockfile && pnpm check`를 재현한다.
3. Pages artifact가 `out/`을 대상으로 생성되었는지 확인한다.
4. Repository variable과 Pages environment 설정을 확인한다.
5. GitHub Actions 버전을 바꿨다면 공식 release 및 migration 안내를 확인한다.

## GA4 운영

GA4를 활성화할 때 다음 절차를 따른다.

1. GA4 Property와 Web data stream을 만든다.
2. 측정 ID(`G-...`)를 GitHub Repository variable `NEXT_PUBLIC_GA_MEASUREMENT_ID`로 등록한다.
3. 배포 후 GA4 Realtime 또는 DebugView에서 최초 페이지 로드와 내부 경로 이동을 확인한다.
4. 동일한 이동이 두 번 집계되지 않는지 확인한다.
5. 개인정보 처리 안내에 사용 목적과 공급자를 기록한다.

현재 구현은 환경 변수가 없으면 GA 스크립트를 렌더링하지 않는다. 로컬 검증이 필요할 때만 `.env.local`에 값을 두며 이 파일은 커밋하지 않는다.

Google Tag Manager나 수동 page view 이벤트를 추가할 경우 GA4 자동 history 측정과 중복되지 않는지 반드시 검증한다.

## 의존성 유지보수

- lockfile 없는 버전 변경을 허용하지 않는다.
- 정기 업데이트는 한 번에 범위를 작게 유지한다.
- Next.js major 업데이트 전 static export 지원과 breaking changes를 확인한다.
- 보안 업데이트 후 `pnpm check`와 실제 Pages 경로를 확인한다.
- Markdown 플러그인은 생성 HTML과 접근성에 영향을 주므로 실제 글 fixture로 회귀 검증한다.
- 더 이상 유지되지 않는 콘텐츠 프레임워크를 핵심 파이프라인에 추가하지 않는다.

## URL과 콘텐츠 보존

- 공개한 Article slug는 영구 식별자로 취급한다.
- GitHub Pages 정적 호스팅에서는 서버 redirect가 제한되므로 공개 URL 변경을 피한다.
- 꼭 URL을 변경해야 한다면 정적 호환 페이지나 canonical 정책을 먼저 설계한다.
- 게시일을 수정일로 덮어쓰지 않는다.
- 삭제보다는 콘텐츠 상태와 대체 글 연결을 우선 검토한다.

## 브랜드와 설계 문서 유지

- 브랜딩 변경은 [`brand-guidelines.md`](brand-guidelines.md)에 반영한다.
- 기술 기반 변경은 [`technical-foundation.md`](technical-foundation.md)의 상태와 근거를 갱신한다.
- 단계별 범위 변경은 [`development-roadmap.md`](development-roadmap.md)에 반영한다.
- 구체적인 UI 결정을 내렸을 때는 미결정 사항에서 제거하고 별도 설계 근거를 남긴다.
- 코드와 문서가 다를 경우 같은 변경에서 함께 수정한다.

## 현재 구현 상태

2026-08-12 기준:

- 1단계 기술 기반이 확정되었다.
- Next.js 정적 프로젝트와 브랜드 토큰의 최소 기반을 구현했다.
- PR CI와 GitHub Pages 배포 파이프라인을 구현했다.
- GA4 연결 지점은 구현했으며 실제 측정은 Repository variable 등록 후 활성화된다.
- Markdown 콘텐츠 파이프라인은 2단계에서 구현한다.
- 현재 화면은 기반 검증용이며 Home의 최종 UI로 확정된 것이 아니다.
