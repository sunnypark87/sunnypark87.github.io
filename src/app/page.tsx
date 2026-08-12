import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.connection} aria-hidden="true">
        <span />
        <i />
        <span />
      </div>
      <p className={styles.eyebrow}>CONNECTED ENGINEERING NOTES</p>
      <h1>Littlebread Lab</h1>
      <p className={styles.tagline}>지식을 연결해 문제를 해결</p>
      <p className={styles.description}>
        지식을 문제에 맞게 연결하여 시스템을 구현하는 개발자의 성장 기록
      </p>
      <aside className={styles.notice} aria-label="현재 구현 상태">
        <span>CURRENT STATUS</span>
        <p>
          블로그의 기술 기반을 구성하고 있습니다. 이 화면은 정적 빌드와 브랜드
          토큰을 확인하기 위한 임시 페이지이며 최종 Home UI가 아닙니다.
        </p>
      </aside>
    </main>
  );
}
