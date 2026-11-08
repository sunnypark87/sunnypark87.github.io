# 로컬 콘텐츠 개발과 Drive 발행

## 구현 범위

원본 posts·assets → 메타데이터 검증 → 본문 변환 → 참조 첨부 복사 → Next.js 정적 빌드 → GitHub Pages 배포를 연결했다. 입력 원본은 수정하지 않는다. 실제 통합 발행 검증은 PR 병합 후 main 워크플로에서 수행한다.

홈의 최근 글, `/posts/` 목록, `/posts/{slug}/` 상세, RSS·sitemap은 새 콘텐츠를 사용한다. 목록은 published 내림차순·같은 날짜는 slug 오름차순이다. 미래 published도 공개한다. 날짜·태그·cover의 선택값은 없는 경우 표시하지 않는다. 본문은 변환 단계에서 정리한 HTML만 PostBody로 렌더링하며, 공개 대상 글 링크와 기본 콜아웃은 CSS로 구분한다.

기존 소개·프로젝트·포트폴리오 및 과거 `/articles/{slug}/` URL은 유지한다. `/articles/`는 새 목록 안내다. 과거 콘텐츠의 이관·URL 리디렉션 정책은 이번 작업에서 정하지 않는다. 현재 추가한 화면 스타일은 콘텐츠 검증에 필요한 최소 구성이며 디자인 시스템 확정이 아니다.

## 로컬 사용

Node.js 22와 저장소에서 지정한 pnpm을 사용한다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev`는 기본으로 `examples/obsidian`의 가상 글·이미지를 사용한다. 실제 Drive 원본이나 인증 정보가 포함된 샘플이 아니다.

사용자가 준비한 로컬 Obsidian 폴더도 사용할 수 있다.

```text
.content/local-test/
├── posts/
│   └── 테스트.md
└── assets/
    └── test.png
```

```bash
CONTENT_DIR=.content/local-test pnpm dev
CONTENT_DIR=.content/local-test pnpm build
pnpm start
```

posts·assets 폴더는 둘 다 있어야 하며 비어 있어도 된다. 필수 속성과 본문 문법은 [메타데이터](obsidian-metadata.md)·[본문 변환](obsidian-body.md) 문서를 따른다. 콘텐츠를 바꾼 뒤 개발 서버를 재시작하면 다시 준비한다. 콘텐츠 파일 감시와 자동 재변환은 아직 구현하지 않았다. 같은 checkout에서 개발·빌드 명령을 동시에 실행하지 않는다.

`pnpm build`와 `pnpm content:prepare`는 CONTENT_DIR을 필수로 받는다. 값이 없거나 잘못되면 샘플·이전 결과로 대체하지 않고 실패한다. 명시적인 샘플 빌드는 `pnpm build:sample`, 전체 검사는 `pnpm check`다. `check`는 입력 환경 변수와 무관하게 샘플을 검증한다. 실제 Drive 빌드는 `pnpm build`를 사용한다.

공개 글이 0개이면 목록에 빈 상태를 표시한다. Next.js 정적 내보내기의 최소 1개 동적 경로 요구를 위해 유효한 slug가 될 수 없는 `__empty` 매개변수에 notFound를 반환한다. 실제 글·RSS·sitemap에는 포함하지 않는다.

## 생성 파일과 참조 첨부

- `.content/site/content.json`: 페이지에서 읽는 메타데이터·정리된 HTML·cover URL·연결 slug. 원본 본문·Drive ID는 포함하지 않는다.
- `public/assets/`: 공개 글의 본문·cover가 참조한 첨부만 원래 하위 경로로 복사한다. 이 경로는 생성기 전용이며 직접 파일을 보관하지 않는다.
- `out/`: HTML과 공개 첨부를 포함한 정적 배포 결과.

생성 경로는 Git에서 제외한다. 모든 글 검증과 임시 첨부 복사가 성공한 뒤 생성 파일을 교체한다. 이전 실행에서 사용했지만 현재는 참조하지 않는 첨부는 제거한다. 교체 중 파일 시스템 오류가 생겨도 명령은 실패하므로 후속 빌드·배포하지 않는다. 입력 원본이 생성 경로와 겹치면 실행을 거부한다. 전체 수집본·manifest·임시 JSON은 public/out으로 복사하지 않는다.

## Actions 발행

기존 `fetch-content.yml` 경로를 유지하고 표시 이름을 **Publish Drive content**로 바꿨다. 문서화된 WIF 조건은 해당 파일의 main 실행을 허용하므로 다시 설정할 필요가 없다.

1. main push 또는 Actions → Publish Drive content → Run workflow → main
2. 서비스 계정 WIF 인증과 Drive 전체 수집·무결성 확인
3. 코드 검사와 콘텐츠 준비를 포함한 `pnpm build`
4. 최신 main 커밋 확인 후 `out`을 Pages artifact로 업로드
5. 앞 단계가 성공했을 때만 github-pages 환경으로 배포

main 이외의 실행은 건너뛴다. 기존 deploy.yml을 제거하여 발행 경로를 하나로 통합했다. 전체 작업은 `pages` 동시 실행 그룹을 사용하며 실행 중인 배포를 취소하지 않는다. 오래된 커밋을 재실행하면 최신 main 검사에서 실패하며 최신 실행을 요청한다. main이 검사 직후 변경될 수 있는 짧은 경합은 다음 main 실행이 최신 상태로 배포한다.

PR CI는 비밀값 없이 샘플로 검사·빌드한다. CI나 로컬 확인만으로 실제 Drive·Pages 통합 검증이 완료되었다고 보지 않는다. 병합 후 인증·수집·빌드·배포 성공 및 실제 글 URL·이미지·링크를 확인한다. 수집·검증·빌드 실패 시 기존 사이트는 유지된다.

정기 실행과 공개 입력·빌드 결과의 30일 보관·복구는 아직 구현하지 않았다. 이번 Pages artifact는 배포 전달용이다.

## 구현 근거

- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [GitHub Actions 동시 실행](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency)
- [Pages 사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
