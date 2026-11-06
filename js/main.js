(function () {
  'use strict';
  // 미로찾기 한 가지만 있는 앱: 처음 화면·메뉴 없이 바로 미로를 연다.
  const maze = G.games[0];
  G.home = () => G.start(maze);
  G.route = () => G.start(maze);
  G.$('#btnSound').addEventListener('click', () => G.setSound(!G.soundOn));
  G.setSound(G.soundOn);
  G.showStars();
  G.route();
})();
