# Obsidian 본문 변환

## 구현 범위

수집된 posts의 메타데이터 검증 후 Markdown을 HTML로 변환한다. `renderObsidianContent(contentDirectory)`는 글별 HTML·메타데이터·대표 이미지 URL·연결된 slug·사용한 첨부 파일 목록과 전체 사용 첨부 목록을 반환한다.

기본 Markdown과 GFM(표·목록·취소선 등)을 지원한다. 코드 블록·인라인 코드의 Obsidian 예시는 변환하지 않는다. 원본 HTML은 실행 가능한 마크업으로 통과시키지 않고, 생성한 HTML도 허용된 태그·속성으로 정리한다.

글 목록·상세 페이지, 디자인·CSS, 검색·수식·코드 색상 강조, 실제 첨부 파일 복사와 배포 연결은 이 단계의 범위가 아니다.

## 글 링크

```md
[[다음 글]]
[[posts/폴더/다음 글.md|이어 읽기]]
[이어 읽기](폴더/다음%20글.md)
```

- 대상은 posts 안의 노트 파일 경로로 찾는다. `.md` 생략을 허용한다.
- 파일명만 쓰면 posts 전체에서 유일하게 일치할 때 연결한다. 중복이면 경로를 명시하도록 오류를 안내한다.
- `posts/…`, `/posts/…`와 posts 기준 하위 경로를 지원한다. `./`·`../` 경로는 현재 노트 위치 기준이다.
- 공개 대상이 있으면 `/posts/{slug}/`로 연결하고 `class="post-link"`, `data-post-slug`를 부여한다. 다음 화면 단계에서 이 표시를 연결 컴포넌트에 활용한다.
- 공개 대상이 없으면 링크를 생성하지 않고 표시 문구만 유지한다. Markdown 링크의 강조 문구도 유지한다.
- 본문 일부를 가리키는 wiki 제목·블록 링크와 노트 본문 임베드는 첫 버전에서 오류로 안내한다.
- HTTP(S)·mailto 외부 링크는 유지한다. 링크 내부의 wiki 예시는 중첩 링크로 변환하지 않는다.

## 이미지와 첨부 자료

```md
![[assets/blog-connection-test/test-image.png]]
![이미지 설명](../assets/blog-connection-test/test-image.png)
[[assets/blog-connection-test/manual.pdf|자료 보기]]
```

- 이미지와 대표 이미지 cover는 수집된 assets 파일에 연결한다. cover는 `assets/…` 텍스트와 `[[assets/…]]` 표기를 지원한다.
- 파일명만 쓴 경우 assets 전체에서 유일하게 일치해야 한다. 경로는 대소문자를 구분하고 Unicode 정규화 차이는 동일한 이름으로 처리한다.
- 일반 Markdown URL은 URL 디코딩 후 찾으며, 생성하는 `/assets/…` URL은 파일명 단위로 인코딩한다.
- 이미지 확장자: png, jpg/jpeg, gif, webp, avif, svg, bmp, ico. 파일의 실제 바이너리 형식 변환·검사는 수행하지 않는다.
- 이미지 임베드 대신 첨부 자료 링크를 사용하면 PDF 등 일반 자료도 참조 목록에 포함한다.
- 본문·cover에서 참조한 파일만 최종 첨부 목록에 포함한다. 이미지 없는 글은 cover 없이 변환한다.
- 파일 누락, 이름 중복, assets 밖의 첨부 참조, 심볼릭 링크는 오류다. 원격 이미지는 이번 로컬 assets 범위에서 지원하지 않는다.
- 이미지 크기 옵션과 파일 내부 fragment/query 옵션은 첫 버전에서 제공하지 않는다.

## 콜아웃

```md
> [!note] 참고
> 본문입니다.
```

`note`, `tip`, `info`, `warning`, `danger`를 의미를 나타내는 aside 요소로 변환한다. 종류는 `data-callout`에 기록하고, 제목은 `callout-title` 문단에 표시한다. 제목의 강조·본문의 목록·중첩 콜아웃을 보존한다. 알 수 없는 종류는 note로 표시하며 제목·본문은 유지한다.

`[!note]+`·`[!note]-`의 접기·펼치기는 아직 지원하지 않으므로 기본 형식으로 수정하도록 오류를 안내한다. 시각 디자인은 후속 단계에서 정한다.

## Actions와 로컬 실행

`Fetch Drive content`는 수집 → 메타데이터 검증 → 본문 변환 순서로 실행한다. 실패 시 파일·항목별 오류를 모아 표시하고 작업을 실패시킨다.

```bash
CONTENT_DIR=.content/import-xxx pnpm content:render-obsidian
```

성공하면 `.content/render-<고유값>/content.json`에 HTML·메타데이터·참조 목록을 기록한다. Actions 출력 `rendered_dir`로 결과 위치를 전달하고, 요약에는 글·첨부 개수만 남긴다. 원본이나 변환 결과를 artifact로 업로드하지 않으며 사이트에 배포하지 않는다. 원본은 변경하지 않는다.

이 단계는 정적 페이지에서 사용할 변환 데이터를 준비하는 단계다. 실제 사용자의 Drive 글 변환은 PR 병합 후 수동 실행으로 검증한다.
