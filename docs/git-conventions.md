# Git 작업 규칙

이 저장소의 브랜치, 커밋, PR과 병합에 적용한다. 사용자 요청에 별도 지시가 있으면 그 지시를 우선한다.

## 브랜치와 작업 흐름

- `main`은 배포 기준 브랜치다. main에 변경이 반영되면 GitHub Pages 배포가 실행된다.
- 작업은 최신 main에서 목적별 브랜치를 만들고 PR로 병합한다. 별도의 develop 브랜치는 두지 않는다.
- 브랜치 이름은 `<type>/<short-description>` 형식의 영문 소문자와 하이픈을 사용한다. 예: `feat/drive-content-import`, `fix/image-paths`, `docs/git-conventions`.
- 하나의 브랜치와 PR은 하나의 목적을 다룬다. 관련 없는 정리나 의존성 업데이트를 섞지 않는다.

## 커밋 메시지

```text
<type>[optional scope]: <summary>
```

type과 scope는 영어로, summary는 한국어로 작성한다. summary는 변경 내용을 짧고 명확하게 표현하고 끝에 마침표를 붙이지 않는다. scope는 변경 범위를 구분할 필요가 있을 때만 사용한다.

| Type | 용도 |
| --- | --- |
| `feat` | 새 기능 |
| `fix` | 오류 수정 |
| `refactor` | 기능 변화 없는 코드 구조 개선 |
| `docs` | 문서 변경 |
| `style` | 동작에 영향 없는 코드 포맷 변경 |
| `test` | 테스트 추가·수정 |
| `perf` | 성능 개선 |
| `build` | 의존성·빌드 설정 변경 |
| `ci` | GitHub Actions 등 자동화 변경 |
| `chore` | 위 분류에 해당하지 않는 유지보수 |
| `revert` | 기존 변경 되돌리기 |

화면 디자인이나 CSS 동작 변경은 단순 포맷 변경이 아니므로 목적에 따라 `feat` 또는 `fix`를 사용한다.

```text
feat(content): Google Drive에서 공개 글 가져오기
fix(content): 임베드 이미지 경로 오류 수정
ci: GitHub Pages 배포 설정
docs: pnpm 사용 및 Git 작업 규칙 문서화
```

호환성이 깨지는 변경은 type 또는 scope 뒤에 `!`를 붙이고 본문에 `BREAKING CHANGE:`로 영향과 전환 방법을 설명한다. 복잡한 변경은 본문에 이유와 검증 결과를 기록한다.

## 커밋 범위와 검증

- 커밋은 독립적으로 설명 가능한 변경 단위로 나눈다.
- 작업 시작 시 `git status`와 diff로 기존 변경을 확인한다. 다른 작업의 변경을 임의로 되돌리거나 포함하지 않는다.
- 파일을 명시적으로 stage하고 `git diff --cached`로 실제 커밋 내용을 확인한다.
- 코드·의존성·설정 변경은 `pnpm check`로 검증한다. 문서만 변경했다면 내용·링크와 `git diff --check`를 확인한다.
- 의존성 변경 시 `package.json`과 `pnpm-lock.yaml`을 함께 반영한다.
- 비밀키·인증 파일·환경 변수 파일, `node_modules/`, `.next/`, `out/`은 커밋하지 않는다.
- Drive에서 수집한 글과 첨부 파일은 빌드 입력으로 사용하며 사이트 저장소에 커밋하지 않는다. 수집 경로를 구현할 때 `.gitignore`도 설정한다.

## PR과 병합

- PR 제목은 커밋 메시지와 같은 형식을 사용한다.
- PR 본문에는 해결하는 문제, 변경 후 동작, 검증 결과와 남은 제약을 적는다. 실행하지 않은 검사는 명시한다.
- CI 통과와 diff 검토 후 squash merge하여 main에는 PR 목적을 대표하는 커밋을 남긴다.
- 병합 후 배포 결과를 확인하고 완료된 작업 브랜치를 정리한다.
- 공유된 커밋을 취소할 때는 이력을 다시 쓰기보다 `git revert`를 우선한다. main에 강제 push하지 않는다.

이 문서는 작업 규칙이며 브랜치 보호나 자동 검사 설정이 완료됐다는 의미는 아니다. 문서 작성만으로 커밋·push·PR 병합을 실행하지 않는다.
