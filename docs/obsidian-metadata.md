# Obsidian 메타데이터 검증

## 범위

Drive 수집 결과의 `posts/` 아래 Markdown 파일을 읽어 Obsidian Properties(YAML front matter)를 검증한다. 하위 폴더도 포함하며 `drafts/`·`templates/`는 읽지 않는다.

이 규칙은 리뉴얼을 위해 합의한 Drive 콘텐츠용 규칙이다. 기존 `content/articles`의 `publishedAt`·category·draft 규칙을 새 콘텐츠에 적용하지 않는다. 신규 글 화면과 정적 빌드 연결은 [콘텐츠 발행](content-publishing.md)에 구현했다. 메타데이터 검증 이후 [본문 변환](obsidian-body.md)을 실행한다.

## 속성

| 속성 | 타입 | 필수 | 처리 |
| --- | --- | --- | --- |
| title | 텍스트 | 예 | 비어 있으면 오류 |
| created | 날짜 | 예 | 최초 작성일 |
| published | 날짜 | 예 | 공개일·목록 정렬 기준 |
| description | 텍스트 | 예 | 요약 |
| slug | 텍스트 | 예 | 영문 소문자·숫자를 하이픈으로 연결, posts 전체에서 유일 |
| updated | 날짜 | 아니요 | 직접 입력한 수정일 |
| tags | 텍스트 목록 | 아니요 | 없으면 빈 목록 |
| cover | 텍스트 | 아니요 | 이미지 경로, 없으면 생략 |

- 날짜는 따옴표 유무와 관계없이 `YYYY-MM-DD` 문자열로 읽고 실제 달력 날짜인지 확인한다. 날짜를 시간대에 따라 다른 날로 변환하지 않는다.
- `created ≤ published`, updated가 있으면 `created ≤ updated`를 확인한다. updated가 published보다 앞선다는 이유로 오류를 내지 않는다.
- 미래 published 날짜를 허용한다. 공개 여부는 posts 폴더로 정하며 날짜로 숨기지 않는다.
- 선택 속성의 생략·null·빈 텍스트는 값 없음으로 처리한다. 필수 속성은 자동 보충하지 않는다.
- aliases 등 추가 Obsidian 속성은 허용하되 현재 반환하는 메타데이터에는 포함하지 않는다. draft·status 같은 추가 속성은 공개 여부에 영향을 주지 않는다.
- YAML 중복 키·잘못된 문법·미지원 태그·별칭은 오류로 안내한다.
- 이 메타데이터 단계에서는 cover의 텍스트 타입을 검사한다. 후속 본문 변환 단계에서 경로·존재 여부·본문 이미지 참조를 검증한다.

## 구현과 실행

`src/lib/obsidian/metadata.ts`의 `loadObsidianPosts(contentDirectory)`는 검증된 속성·원본 본문·posts 기준 파일 경로를 반환한다. 목록은 published 내림차순, 같은 날짜는 slug 오름차순으로 정렬한다.

CLI는 `CONTENT_DIR` 환경 변수로 수집 결과 루트를 받는다. 예를 들어 `.content/import-xxx/posts/`가 있다면 CONTENT_DIR은 `.content/import-xxx`다.

```bash
CONTENT_DIR=.content/import-xxx pnpm content:validate-obsidian
```

`Fetch Drive content` 워크플로는 수집 단계의 `content_dir` 출력을 검증 단계에 전달한다. 실패 시 파일 경로·속성·오류 원인을 모아 출력하고 비정상 종료한다. 성공 시 글 개수만 요약하며, 글 본문이나 인증 설정값은 출력하지 않는다. 오류의 파일 경로는 Actions 로그에 표시된다.

빈 posts 폴더는 글 0개로 처리한다. posts 폴더 누락·읽기 오류·심볼릭 링크는 실패한다. 원본 파일을 수정하거나 변환 결과를 공개하지 않는다.

## 검증 상태

합성 테스트 글로 YAML·필수 속성·달력 날짜·미래 날짜·중복 slug·정렬·파일 시스템 처리를 자동 검사한다. 기존 사이트 검사·빌드도 통과해야 한다. 실제 Drive 테스트 글 검증은 이 변경을 main에 병합한 뒤 수동 워크플로로 확인한다.
