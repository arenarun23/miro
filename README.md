# 미로찾기

AIEDU 허브(`arenarun23/aiedu`)의 하위 서비스. 손가락으로 길을 그려 짝꿍(🐭→🧀 등 8가지)에게 가는 미로 게임.

- 쉬움(칸 큼) / 어려움(칸 작음). 별은 걸음 수로 1~3개(힌트를 쓰면 1개 줄어듦). 별 기록은 이 기기의 localStorage(`miro:` 접두어).
- 조작: 손가락·마우스로 길을 따라 끌기, 옆 칸 누르기, 방향키/WASD.
- 구조: `index.html`, `css/style.css`, `js/core.js`(공통 도우미, 레이싱 등이 있는 `arenarun23/game` 과 같은 뼈대), `js/games/maze.js`(미로 만들기·그리기·조작), `js/main.js`.
- 정적 파일·상대경로만, 외부 호스트·키 없음. 이미지는 이모지, 소리는 WebAudio.

## 배포
- `main` 에 push → `.github/workflows/notify-hub.yml` 이 허브(Vercel) 재배포를 요청 → 20~60초 안에 `https://aiedu-pearl.vercel.app/miro/` 갱신. 저장소 Secret `HUB_DEPLOY_HOOK`(허브 Deploy Hook 주소) 필요. 없으면 허브가 5분마다 확인하는 안전망으로 갱신된다.
