# Littlebread Lab 디자인 토큰

이 문서는 5단계에서 확정한 공통 시각 언어를 기록한다. 페이지별 레이아웃이나 카드·Sidebar·목차의 형태를 정하는 문서가 아니다.

## 원칙

- 콘텐츠의 이해를 우선하고, 장식은 정보 관계를 설명할 때만 사용한다.
- Engineering Notebook의 읽기 경험을 Knowledge Network보다 우선한다.
- 여백, 타이포그래피와 정렬을 테두리나 카드보다 먼저 사용한다.
- Slate Blue는 링크와 중요한 연결, Warm Brown은 제한적인 보조 강조에 사용한다.
- 색상만으로 상태나 의미를 전달하지 않는다.

## 색상

브랜드 색상은 [`brand-guidelines.md`](./brand-guidelines.md)의 확정 팔레트를 그대로 사용한다. `src/app/globals.css`의 semantic 색상은 브랜드 색상과 별도로 피드백·데이터 상태를 표현하기 위한 것이다.

| 역할 | 토큰 | 용도 |
| --- | --- | --- |
| 배경 | `--color-background-*` | 페이지, 표면, 낮은 대비 영역 |
| 본문 | `--color-text-*` | 주요·보조·낮은 강조 텍스트 |
| 상호작용 | `--color-brand-*`, `--color-focus-ring` | 링크, 현재 상태, 키보드 포커스 |
| 피드백 | `--color-feedback-*` | 성공·주의·오류 |
| 데이터 | `--color-data-*` | 상승·하락·중립 데이터 |

피드백과 데이터 색상은 텍스트, 아이콘 또는 레이블과 함께 사용한다. 금융 상승·하락을 브랜드 색상으로 대체하지 않는다.

## 타이포그래피

- `--font-primary`: Pretendard 우선. 제목, 본문, UI에 사용한다.
- `--font-mono`: Geist Mono 우선. 코드, 날짜, 읽는 시간, 파일명과 기술 메타데이터에만 사용한다.
- `--font-size-body`, `--font-size-body-small`, `--font-size-label`, `--font-size-code`는 기본 본문·설명·레이블·코드의 역할을 나타낸다.
- `--leading-body`, `--leading-heading`, `--leading-tight`는 본문과 제목의 행간 역할을 나타낸다.
- 날짜·상태·topics처럼 독자가 읽어야 하는 작은 메타데이터는 `--color-text-secondary`를 우선 사용한다. `--color-text-muted`는 의미 전달에 필수적이지 않은 보조 정보에 제한한다.

실제 Pretendard와 Geist Mono 파일을 저장소에서 제공하는 작업은 라이선스와 필요한 문자 범위를 확인한 뒤 별도 변경으로 진행한다. 파일이 없는 환경에서도 현재 fallback 스택으로 콘텐츠가 동작해야 한다.

## 레이아웃과 간격

- `--content-width-reading`: 긴 글의 읽기 폭
- `--content-width-page`: 목록·소개 페이지의 기본 폭
- `--content-width-wide`: 사이트 헤더 등 넓은 공통 영역의 폭
- `--space-*`: 인라인 요소부터 페이지 여백까지의 간격 스케일

이 토큰은 레이아웃을 하나의 고정 템플릿으로 만들기 위한 것이 아니다. 6단계에서 Article 화면을 설계할 때 필요한 범위 안에서 조합한다.

## 본문 규칙

- 코드 블록, 넓은 표와 블록 수식은 콘텐츠 영역을 밀어내지 않고 내부 가로 스크롤을 사용한다.
- 제목에는 `scroll-margin-top`을 적용해 앵커 이동 시 헤더에 가리지 않도록 한다.
- 인용문은 낮은 대비의 관계선과 보조 텍스트로 표현한다.
- 표 헤더는 `--color-background-subtle`로 구분하고 테두리를 최소화한다.
- 이미지와 미디어는 콘텐츠 폭을 넘지 않는다.

## 접근성 상태

- 모든 키보드 포커스는 `:focus-visible` 링으로 확인할 수 있어야 한다.
- 링크는 색상뿐 아니라 밑줄 또는 현재 상태의 굵기와 함께 구분한다.
- `prefers-reduced-motion: reduce`에서는 애니메이션과 전환을 최소화한다.
- 320px 화면과 200% 확대에서도 긴 제목·코드·표가 페이지 전체를 가로로 밀어내지 않아야 한다.

## 미결정 사항

다음은 이 문서에서 확정하지 않는다.

- Article 상세의 목차·Sidebar 위치
- 카드 컴포넌트와 관계 섹션의 최종 형태
- 모바일 내비게이션의 세부 구조
- 다크 모드
- 최종 로고·파비콘·OG 이미지
