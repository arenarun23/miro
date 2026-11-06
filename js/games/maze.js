// 미로 찾기 (8가지 짝꿍)
//  쉬움: 칸이 큼(짧은 쪽 6칸) / 어려움: 칸이 작음(짧은 쪽 11칸)
//  손가락·마우스로 길을 따라 그리거나, 옆 칸을 누르거나, 방향키로 움직인다.
(function () {
  'use strict';
  const THEMES = [
    { n: '생쥐와 치즈', p: '🐭', g: '🧀', w: '치즈' },
    { n: '토끼와 당근', p: '🐰', g: '🥕', w: '당근' },
    { n: '곰과 꿀', p: '🐻', g: '🍯', w: '꿀' },
    { n: '강아지와 뼈다귀', p: '🐶', g: '🦴', w: '뼈다귀' },
    { n: '꿀벌과 꽃', p: '🐝', g: '🌸', w: '꽃' },
    { n: '로켓과 지구', p: '🚀', g: '🌍', w: '지구' },
    { n: '고양이와 생선', p: '🐱', g: '🐟', w: '생선' },
    { n: '원숭이와 바나나', p: '🐵', g: '🍌', w: '바나나' },
  ];
  const N = 1, E = 2, S = 4, W = 8, DX = { [N]: 0, [E]: 1, [S]: 0, [W]: -1 }, DY = { [N]: -1, [E]: 0, [S]: 1, [W]: 0 };
  const OPP = { [N]: S, [E]: W, [S]: N, [W]: E };
  const SHORT = { easy: 6, hard: 11 };
  const FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  // 막다른 길이 많은 미로 만들기 (깊이 우선, 스택 사용)
  function build(c, r) {
    const open = Array.from({ length: r }, () => new Array(c).fill(0));
    const seen = Array.from({ length: r }, () => new Array(c).fill(false));
    const st = [[0, 0]]; seen[0][0] = true;
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const ds = G.shuffle([N, E, S, W]).filter((d) => { const nx = x + DX[d], ny = y + DY[d]; return nx >= 0 && ny >= 0 && nx < c && ny < r && !seen[ny][nx]; });
      if (!ds.length) { st.pop(); continue; }
      const d = ds[0], nx = x + DX[d], ny = y + DY[d];
      open[y][x] |= d; open[ny][nx] |= OPP[d]; seen[ny][nx] = true; st.push([nx, ny]);
    }
    return open;
  }
  // 두 칸 사이의 가장 짧은 길 (벽을 따라서만)
  function route(open, c, r, from, to) {
    const prev = new Map(), key = (p) => p[1] * c + p[0], q = [from]; prev.set(key(from), null);
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      if (x === to[0] && y === to[1]) break;
      for (const d of [N, E, S, W]) if (open[y][x] & d) {
        const n = [x + DX[d], y + DY[d]];
        if (!prev.has(key(n))) { prev.set(key(n), [x, y]); q.push(n); }
      }
    }
    if (!prev.has(key(to))) return null;
    const out = []; for (let p = to; p; p = prev.get(key(p))) out.push(p);
    return out.reverse();
  }

  G.register({
    id: 'maze', name: '미로찾기', desc: '길을 따라 가요', icon: '🧩', cat: 'play', color: 'lilac', variants: THEMES.length,
    start(root, { hard, v }) {
      const T = THEMES[v], short = SHORT[hard ? 'hard' : 'easy'];
      const box = G.h('div', { class: 'fitbox mazebox' }), cv = G.h('canvas', { class: 'maze', role: 'img', 'aria-label': '미로. 손가락으로 길을 따라 ' + T.w + '에게 가요' });
      box.append(cv);
      const mv = G.h('span', {}, '👣 0');
      let hintBtn = null, hintLeft = 0, hintUsed = 0, hintTimer = 0, steps = 0, done = false;
      let c = 0, r = 0, open = null, pos = [0, 0], trail = [[0, 0]], hintPath = null, cell = 0, ox = 0, oy = 0, best = 1;
      const ask = G.h('div', { class: 'hint must' }, `${T.p} 길을 따라 ${T.g} ${T.w}에게 가요`);

      function make() {
        const W = box.clientWidth || 600, H = box.clientHeight || 400, s = Math.min(W, H) / short;
        c = Math.max(3, Math.floor(W / s)); r = Math.max(3, Math.floor(H / s));
        c = Math.min(c, Math.ceil(r * 1.8)); r = Math.min(r, Math.ceil(c * 1.8));   // 너무 길쭉한 미로는 피한다
        open = build(c, r); pos = [0, 0]; trail = [[0, 0]]; steps = 0; hintPath = null; done = false;
        best = route(open, c, r, [0, 0], [c - 1, r - 1]).length - 1;
        mv.textContent = '👣 0';
      }
      function draw() {
        if (!open) return;
        const W = box.clientWidth, H = box.clientHeight;
        if (!W || !H) return;
        cell = Math.floor(Math.min(W / c, H / r)); const w = cell * c, h = cell * r;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        cv.style.width = w + 'px'; cv.style.height = h + 'px';
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
        x.fillStyle = '#fffdf5'; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,200,120,.45)'; x.fillRect((c - 1) * cell, (r - 1) * cell, cell, cell);
        const mid = (p) => [p[0] * cell + cell / 2, p[1] * cell + cell / 2];
        const line = (pts, col, wd, dash) => {
          if (pts.length < 2) return;
          x.beginPath(); pts.forEach((p, i) => { const m = mid(p); i ? x.lineTo(m[0], m[1]) : x.moveTo(m[0], m[1]); });
          x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.stroke(); x.setLineDash([]);
        };
        if (hintPath) line(hintPath, 'rgba(255,190,40,.85)', cell * 0.22, [cell * 0.05, cell * 0.28]);
        line(trail, 'rgba(255,122,168,.55)', cell * 0.3);
        // 벽
        x.beginPath();
        for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) {
          const o = open[j][i], x0 = i * cell, y0 = j * cell;
          if (!(o & N)) { x.moveTo(x0, y0); x.lineTo(x0 + cell, y0); }
          if (!(o & W)) { x.moveTo(x0, y0); x.lineTo(x0, y0 + cell); }
          if (j === r - 1 && !(o & S)) { x.moveTo(x0, y0 + cell); x.lineTo(x0 + cell, y0 + cell); }
          if (i === c - 1 && !(o & E)) { x.moveTo(x0 + cell, y0); x.lineTo(x0 + cell, y0 + cell); }
        }
        x.strokeStyle = '#8a5a3a'; x.lineWidth = Math.max(3, cell * 0.11); x.lineCap = 'round'; x.stroke();
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Math.floor(cell * 0.66)}px ${FONT}`;
        const g = mid([c - 1, r - 1]); x.fillText(T.g, g[0], g[1] + cell * 0.03);
        const p = mid(pos); x.fillText(T.p, p[0], p[1] + cell * 0.03);
      }

      function step(d) {
        if (done || !(open[pos[1]][pos[0]] & d)) return false;
        const n = [pos[0] + DX[d], pos[1] + DY[d]], pv = trail[trail.length - 2];
        if (pv && pv[0] === n[0] && pv[1] === n[1]) trail.pop(); else trail.push(n);
        pos = n; steps++; mv.textContent = '👣 ' + steps; G.sfx.flip(); hintPath = null; draw();
        if (n[0] === c - 1 && n[1] === r - 1) finish();
        return true;
      }
      function moveTo(tx, ty) {                                       // 가까운 칸이면 벽을 따라 걸어간다
        if (tx < 0 || ty < 0 || tx >= c || ty >= r || (tx === pos[0] && ty === pos[1])) return;
        const path = route(open, c, r, pos, [tx, ty]);
        if (!path || path.length > 5) return;
        for (let i = 1; i < path.length && !done; i++) {
          const a = path[i - 1], b = path[i];
          step(DX[N] === b[0] - a[0] && DY[N] === b[1] - a[1] ? N : b[0] > a[0] ? E : b[0] < a[0] ? W : b[1] > a[1] ? S : N);
        }
      }
      function finish() {
        done = true; clearTimeout(hintTimer);
        const ratio = steps / Math.max(1, best);
        let st = ratio <= 1.5 ? 3 : ratio <= 2.5 ? 2 : 1;
        st = Math.max(1, st - (hintUsed ? 1 : 0));
        setTimeout(() => G.win({ stars: st, text: `${T.p} ${T.g} ${steps}걸음!` + (hintUsed ? ' (힌트를 썼어요)' : '') }), 350);
      }

      let drag = false;
      const at = (e) => { const b = cv.getBoundingClientRect(); return [Math.floor((e.clientX - b.left) / (b.width / c)), Math.floor((e.clientY - b.top) / (b.height / r))]; };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} const t = at(e); moveTo(t[0], t[1]); });
      cv.addEventListener('pointermove', (e) => { if (drag) { const t = at(e); moveTo(t[0], t[1]); } });
      const up = () => { drag = false; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const KEYS = { ArrowUp: N, ArrowRight: E, ArrowDown: S, ArrowLeft: W, w: N, d: E, s: S, a: W };
      const onKey = (e) => { const d = KEYS[e.key]; if (d) { e.preventDefault(); step(d); } };
      addEventListener('keydown', onKey);

      // 힌트: 지금 자리에서 도착점까지 길을 잠깐 보여 준다 (별 1개 줄어듦)
      hintBtn = G.h('button', { class: 'btn alt hintbtn', onclick: () => {
        if (done) return;
        hintUsed++; G.sfx.tap(); hintPath = route(open, c, r, pos, [c - 1, r - 1]); draw();
        clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintPath = null; draw(); }, 2500);
      } }, '💡 힌트');
      root.append(ask, G.h('div', { class: 'hud' }, mv, hintBtn), box);

      make(); draw();
      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
      if (ro) ro.observe(box);
      requestAnimationFrame(() => { make(); draw(); });          // 상자 크기가 정해진 뒤 한 번 더 맞춘다
      return () => { removeEventListener('keydown', onKey); clearTimeout(hintTimer); if (ro) ro.disconnect(); };
    },
  });
})();
