# Drive 수동 수집 설정

## 현재 범위

`Fetch Drive content` 워크플로를 수동 실행하면 `/posts`와 `/assets`를 하위 폴더까지 다운로드한다. 외부 연결 설정은 아직 수행하지 않았으며 아래 순서로 준비한다.

- `scripts/fetch-drive.mjs`는 Node.js 22의 기본 API만 사용한다.
- 결과는 `.content/import-<고유값>/`에 저장한다. 성공한 실행에만 `manifest.json`을 작성한다.
- manifest에는 파일 경로·Drive ID·버전·SHA-256·크기와 코드 커밋·수집 시각을 기록한다.
- 원본·manifest는 Git, Pages, Actions artifact에 올리지 않는다. 수동 연결 테스트 단계에서는 파일 개수와 검증 결과만 실행 요약에 표시한다.
- 메타데이터·Obsidian 문법 변환, 사이트 배포 연결, 정기 실행, 30일 복구용 보관은 후속 작업이다.

## 1. Google Cloud 프로젝트 준비

[Google Cloud Console](https://console.cloud.google.com/)에서 블로그 자동화용 프로젝트를 만든다. 프로젝트 표시 이름과 별개인 **프로젝트 ID**를 기록한다.

아래 명령은 프로젝트 생성 권한을 가진 계정으로 Cloud Shell에서 실행한다. `YOUR_PROJECT_ID`만 생성한 프로젝트 ID로 바꾼다. 이 문서의 명령은 아직 실행하지 않았다.

```bash
BLOG_PROJECT_ID='YOUR_PROJECT_ID'
gcloud config set project "$BLOG_PROJECT_ID"
gcloud services enable drive.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project="$BLOG_PROJECT_ID"
gcloud iam service-accounts create blog-content-reader --display-name='Blog content reader' --project="$BLOG_PROJECT_ID"
BLOG_SERVICE_ACCOUNT="blog-content-reader@${BLOG_PROJECT_ID}.iam.gserviceaccount.com"
```

서비스 계정에 프로젝트 Owner/Editor 권한이나 JSON 키를 부여할 필요는 없다. 파일 접근 권한은 아래 Drive 공유로 부여한다.

## 2. Drive 폴더 공유

Drive 웹에서 동기화된 `posts`와 `assets` 각각의 공유 메뉴를 열어 위 서비스 계정 이메일을 **뷰어**로 추가한다. 하위 파일에도 읽기 권한이 적용되는지 확인한다.

각 폴더 URL의 `/folders/` 다음 ID를 기록한다. 폴더 바로가기 ID 대신 실제 폴더 ID를 사용한다. `drafts`와 `templates`는 공유하지 않는다.

## 3. GitHub WIF 연결

이 저장소의 GitHub API에서 확인한 식별자:

- 저장소: `sunnypark87/sunnypark87.github.io`
- 저장소 ID: `854376129`
- 소유자 ID: `73125851`

수동 수집 워크플로의 **main 브랜치 실행**만 허용한다. 저장소 이전 시 조건을 다시 검토한다.

```bash
gcloud iam workload-identity-pools create blog-github --location=global --display-name='Blog GitHub Actions' --project="$BLOG_PROJECT_ID"
BLOG_PROJECT_NUMBER=$(gcloud projects describe "$BLOG_PROJECT_ID" --format='value(projectNumber)')
gcloud iam workload-identity-pools providers create-oidc github --project="$BLOG_PROJECT_ID" --location=global --workload-identity-pool=blog-github --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' --attribute-condition="assertion.repository_owner_id == '73125851' && assertion.repository_id == '854376129' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'sunnypark87/sunnypark87.github.io/.github/workflows/fetch-content.yml@refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding "$BLOG_SERVICE_ACCOUNT" --project="$BLOG_PROJECT_ID" --role='roles/iam.workloadIdentityUser' --member="principalSet://iam.googleapis.com/projects/${BLOG_PROJECT_NUMBER}/locations/global/workloadIdentityPools/blog-github/attribute.repository_id/854376129"
gcloud iam workload-identity-pools providers describe github --project="$BLOG_PROJECT_ID" --location=global --workload-identity-pool=blog-github --format='value(name)'
```

마지막 출력은 `projects/<프로젝트 번호>/locations/global/workloadIdentityPools/blog-github/providers/github` 형식이다.

인증 Action은 서비스 계정의 OAuth 액세스 토큰을 발급한다. 범위는 `drive.readonly`, 수명은 1시간이며 토큰을 사용하는 수집 작업 제한은 45분이다. 발급된 토큰은 해당 단계의 환경 변수로만 전달한다. WIF 조건은 나중에 정기 발행 워크플로를 연결할 때 함께 수정해야 한다.

## 4. GitHub 저장소 Secrets

사용자가 저장소 **Settings → Secrets and variables → Actions → Secrets → New repository secret**에서 다음 값을 직접 등록한다. Name에 아래 이름을, Secret에 실제 값을 입력하고 Add secret을 누른다. 실제 값은 대화·소스 코드·문서에 기재하지 않는다. 장기 JSON 비밀키는 만들거나 등록하지 않는다.

| Secret 이름 | 직접 입력할 값 |
| --- | --- |
| `GCP_PROJECT_ID` | 프로젝트 ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | 위 provider 조회 결과 전체 |
| `GCP_SERVICE_ACCOUNT` | `blog-content-reader@<프로젝트 ID>.iam.gserviceaccount.com` |
| `DRIVE_POSTS_FOLDER_ID` | posts 실제 폴더 ID |
| `DRIVE_ASSETS_FOLDER_ID` | assets 실제 폴더 ID |

## 5. 수동 실행과 확인

1. 코드 검증·PR 검토를 거쳐 수집 워크플로를 기본 브랜치 `main`에 반영한다. 수집 기능은 현재 사이트와 독립적으로 실행한다.
2. 설정 전파에 몇 분이 걸릴 수 있다. Drive 동기화가 끝난 뒤 실행한다.
3. **Actions → Fetch Drive content → Run workflow → main**을 선택한다.
4. 실행 요약에서 `posts`·`assets` 파일 개수와 크기·해시·수집 전후 목록 검증 성공을 확인한다.

수집 테스트는 배포하지 않는다. 기존 `Deploy to GitHub Pages`는 main push 시 기존 사이트를 다시 빌드·배포한다. 이 수집 작업은 사이트 콘텐츠를 변경하지 않는다.

## 수집 오류 정책

- 429·서버 오류·일부 할당량 오류·네트워크 오류: 최대 3회 시도, 재시도 간격 1초·2초.
- 인증·공유 권한 오류: 즉시 실패. 토큰이나 Drive 응답 본문은 로그에 출력하지 않는다.
- 파일명 충돌(대소문자·Unicode 정규화 포함), 경로 구분자·제어 문자: 실패.
- Drive 바로가기·Google Docs 등 원본 다운로드가 불가능한 Workspace 문서: 실패. Markdown과 일반 첨부 파일을 사용한다.
- 다운로드 크기·MD5가 Drive 메타데이터와 다르면 실패.
- 수집 전후 전체 목록의 ID·경로·버전 등이 달라지면 실패하고 재실행을 안내한다. 이는 변경 감지이며 Drive 전체의 원자적 스냅샷을 보장하지 않는다.
- 실패한 실행이 만든 임시 디렉터리는 제거하고, 이전 실행 결과는 덮어쓰지 않는다.

## 로컬 검증

```bash
node --test scripts/fetch-drive.node-test.mjs
pnpm check
```

실제 수집은 세 환경 변수 `GOOGLE_DRIVE_ACCESS_TOKEN`, `DRIVE_POSTS_FOLDER_ID`, `DRIVE_ASSETS_FOLDER_ID`가 설정된 환경에서 `node scripts/fetch-drive.mjs`로 실행할 수 있다. 토큰을 소스나 커밋에 넣지 않는다.

## 참고 문서

- [서비스 계정을 거치는 WIF](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account)
- [배포 파이프라인 WIF 설정](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Drive 파일 목록 API](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list)
- [Drive 파일 다운로드](https://developers.google.com/workspace/drive/api/guides/manage-downloads)
