# miro — 미로찾기

AIEDU 허브(`arenarun23/aiedu`)의 하위 서비스(id `miro`). 구조는 `README.md`.

지킬 규칙(허브 공통):
- 정적 파일·**상대경로만**, 빌드 단계 추가 금지. 외부 호스트 호출 금지(글꼴은 `../fonts/jua.css`), 서버·키 없음.
- 화면은 여러 크기(1280×560, 844×390, 360×640 등)에서 **한 화면에 맞아야** 한다(허브 `node scripts/fit-check.mjs <URL>`). 터치 ≥44px, `prefers-reduced-motion` 존중.
- **AIEDU 복귀 아이콘**(`a.aiedu-home`, 웃는 별)은 지우거나 옮기지 않는다. 왼쪽 위 52×52px 를 비운다(`#bar{padding-left:calc(.7rem + 46px)}`).
- localStorage 키 접두어는 `miro:` (허브 같은 출처의 다른 앱과 겹치지 않게).
- 수정 후: 로컬 서버로 열어 끝까지 플레이 → `main` push. 허브가 자동 갱신(`notify-hub.yml`).
- Deploy Hook 주소·Secret 값은 파일·커밋·로그에 쓰지 않는다.

주의(2026-11-06 사고): `maze.js` 의 `draw()` 안에서 상자 너비를 `W` 로 불렀다가 방향 상수 `W`(=8)를 가려, 벽이 맵마다 한두 개씩 안 그려졌다(실제로는 막혀 있어 "직진이 안 된다"). 방향 상수 `N E S W` 와 같은 이름의 지역 변수를 쓰지 않는다. 수정 후엔 그림(캔버스 픽셀)과 데이터(`open`)가 일치하는지 시험한다.
