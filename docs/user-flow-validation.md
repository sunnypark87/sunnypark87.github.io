# 핵심 사용자 흐름 검증 기록

## 검증 정보

- 기준일: 2026-08-20
- 검증 범위: Home, Articles, Article 상세, Projects 빈 상태
- 자동 검증: `pnpm check`
- 콘텐츠: 공개 Article 2개, 공개 Project 0개

## 자동·정적 검증

| 시나리오 | 결과 | 근거 |
| --- | --- | --- |
| Home에서 최근 Article로 이동 | Pass | Home에 공개 Article 링크가 정적으로 생성됨 |
| Articles에서 Article 선택 | Pass | 공개 Article 2개 경로 생성 및 목록 출력 |
| Article 관계 탐색 | Pass | 선행 글·다음 단계 그룹과 상호 링크 생성 |
| 관계가 없는 그룹 숨김 | Pass | 관계 조회 테스트 통과 |
| Project 빈 상태에서 Article 이동 | Pass | Projects 빈 상태에 Articles 링크 제공 |
| draft·존재하지 않는 관계 차단 | Pass | 콘텐츠 관계 검증 통과 |

## 구현 보완 결과

- Home에 현재 관심 영역 `Quant`를 추가했다.
- Articles 목록에 상태·Category·게시일과 topics를 표시한다.
- Article 헤더에 게시일·수정일·읽는 시간·topics를 의미 있는 구조로 표시한다.
- 모든 주요 페이지에 `main-content` 대상과 skip link를 추가했다.
- Project 빈 상태에서 Articles로 이동할 수 있다.
- 코드·표·블록 수식에 콘텐츠 영역을 넘지 않는 overflow 방어를 추가했다.

## 수동 검증 상태

2026-08-20 실제 브라우저에서 다음 항목을 확인했으며 발견된 문제는 없었다.

- [x] 320px, 375px, 768px, 데스크톱 화면 확인
- [x] Home → Articles → Article → 관계 Article 흐름 확인
- [x] Tab/Shift+Tab 포커스 순서 확인
- [x] 포커스 표시와 색상 대비 확인
- [x] 긴 제목·코드·표·수식 확인

## 콘텐츠 정책

`content-pipeline-fixture`는 현재 4단계 흐름 검증을 위해 공개 상태로 유지한다. 최종 공개 전에는 실제 독자 대상 Article로 내용을 정식화하거나 `draft: true`로 전환하고 관계 데이터를 다시 구성한다.

## 유예 항목

Project 상세 및 Article–Project 양방향 흐름은 공개 Project 콘텐츠가 추가될 때 검증한다. 전체 Knowledge Graph, 검색, Sidebar와 최종 목차는 현재 범위에 포함하지 않는다.

## 5·6단계 전달사항

- 5단계: 메타데이터와 본문 사이의 시각적 위계, overflow 규칙, 포커스 상태와 semantic color를 실제 브라우저에서 재검토한다.
- 6단계: 관계 섹션의 최종 위치·정보량, 긴 글 목차 필요성, Project 연결 표현을 실제 콘텐츠를 기준으로 결정한다.
