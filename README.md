# Littlebread Lab

> 지식을 연결해 문제를 해결
>
> Connect Knowledge. Solve Problems.

Littlebread Lab은 지식을 문제에 맞게 연결하여 시스템을 구현하는 개발자의 성장 기록을 담는 개인 기술 블로그다.

## 현재 상태

Next.js와 GitHub Pages를 사용하는 정적 블로그 기반을 구성했다. Markdown 콘텐츠 모델과 초기 정보 구조를 구현했으며, 현재는 실제 Article 관계를 통한 사용자 흐름을 검증하고 있다. 화면은 아직 최종 Home UI가 아니다.

## 시작하기

```bash
pnpm install --frozen-lockfile
pnpm dev
```

프로덕션과 동일한 품질 검사를 실행한다.

```bash
pnpm check
```

정적 빌드 결과를 미리 확인한다.

```bash
pnpm build
pnpm start
```

## 문서

- [브랜드 가이드](docs/brand-guidelines.md)
- [구축 로드맵](docs/development-roadmap.md)
- [기술 기반 결정](docs/technical-foundation.md)
- [운영 가이드](docs/operations.md)
- [정보 구조](docs/information-architecture.md)
- [사용자 흐름](docs/user-flows.md)
- [콘텐츠 모델](docs/content-model.md)
