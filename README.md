# Littlebread Lab

Obsidian·Google Drive 기반 기술 블로그입니다. 리뉴얼 방향과 구현 범위는 [구조 문서](docs/structure.md)를 확인하세요.

Node.js 22와 package.json의 pnpm 버전을 사용합니다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

기본 개발 콘텐츠는 `examples/obsidian`입니다. 사용자 폴더로 개발하려면 `CONTENT_DIR=/절대경로/보관함 pnpm dev`를 실행합니다. 글을 바꾼 뒤 개발 서버를 재시작하면 다시 변환합니다.

- `pnpm check`: lint·타입·테스트·샘플 정적 빌드
- `pnpm build:sample`: 명시적인 샘플 정적 빌드
- `CONTENT_DIR=.content/local-test pnpm build`: 지정한 공개 콘텐츠 정적 빌드
- `pnpm start`: 생성된 out 미리보기

실제 발행은 Actions의 **Publish Drive content**를 main에서 실행합니다. main push에도 발행합니다. 샘플이 배포 입력의 대체값으로 사용되지 않도록 일반 build는 CONTENT_DIR을 필수로 받습니다.

[로컬 개발·발행 안내](docs/content-publishing.md) · [Drive 설정](docs/drive-content-setup.md) · [Git 작업 규칙](docs/git-conventions.md)
