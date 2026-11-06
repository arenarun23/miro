// 미로 찾기 (8가지 짝꿍)
//  쉬움: 칸이 큼(짧은 쪽 6칸) / 어려움: 칸이 작음(짧은 쪽 11칸)
//  손가락·마우스로 길을 따라 그리거나, 옆 칸을 누르거나, 방향키로 움직인다.
(function () {
  'use strict';
  const THEMES = [
    { n: '생쥐와 치즈', p: '🐭', g: '🧀', w: '치즈', wall: '#a8743a', floor: '#fff8e1' },
    { n: '토끼와 당근', p: '🐰', g: '🥕', w: '당근', wall: '#4f9a4a', floor: '#f1fbe9' },
    { n: '곰과 꿀', p: '🐻', g: '🍯', w: '꿀', wall: '#8a5a3a', floor: '#fff3e0' },
    { n: '강아지와 뼈다귀', p: '🐶', g: '🦴', w: '뼈다귀', wall: '#b0703a', floor: '#fff7ec' },
    { n: '꿀벌과 꽃', p: '🐝', g: '🌸', w: '꽃', wall: '#d19a00', floor: '#fffbe0' },
    { n: '로켓과 지구', p: '🚀', g: '🌍', w: '지구', wall: '#4a5fb0', floor: '#eaf0ff' },
    { n: '고양이와 생선', p: '🐱', g: '🐟', w: '생선', wall: '#3d8fb0', floor: '#e9f7fb' },
    { n: '원숭이와 바나나', p: '🐵', g: '🍌', w: '바나나', wall: '#a0622d', floor: '#fff6df' },
  ];
  const N = 1, E = 2, S = 4, W = 8, DX = { [N]: 0, [E]: 1, [S]: 0, [W]: -1 }, DY = { [N]: -1, [E]: 0, [S]: 1, [W]: 0 };
  const OPP = { [N]: S, [E]: W, [S]: N, [W]: E };
  const SHORT = { easy: 6, hard: 11 };
  const FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  // 테두리 모양 7가지: 칸 중심이 도형 안(0~1 좌표)에 있으면 길이 있는 칸이다
  const inPoly = (pts) => (u, v) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  const reg = (n, rot) => Array.from({ length: n }, (_, k) => [0.5 + 0.5 * Math.cos(rot + (2 * Math.PI * k) / n), 0.5 + 0.5 * Math.sin(rot + (2 * Math.PI * k) / n)]);
  const SHAPES = [
    { id: 'rect', name: '사각형', icon: '⬜', f: () => true },
    { id: 'circle', name: '원', icon: '⭕', f: (u, v) => (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.25 },
    { id: 'tri', name: '삼각형', icon: '🔺', f: (u, v) => v >= 0.04 && v <= 0.96 && Math.abs(u - 0.5) <= ((v - 0.04) / 0.92) * 0.5 },
    { id: 'dia', name: '마름모', icon: '🔶', f: (u, v) => Math.abs(u - 0.5) + Math.abs(v - 0.5) <= 0.5 },
    { id: 'pent', name: '오각형', icon: '⬟', f: inPoly(reg(5, -Math.PI / 2)) },
    { id: 'hex', name: '육각형', icon: '⬢', f: inPoly(reg(6, 0)) },
    { id: 'heart', name: '하트', icon: '💖', f: (u, v) => { const x = (u - 0.5) * 2.7, y = (0.5 - v) * 2.6 + 0.15; return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0; } },
  ];
  // 도형 안의 칸만 남기고, 떨어진 조각은 버린다(가장 큰 덩어리만). 너무 작으면 null
  function maskFor(shape, c, r) {
    const ins = Array.from({ length: r }, (_, j) => Array.from({ length: c }, (_, i) => shape.f((i + 0.5) / c, (j + 0.5) / r)));
    const comp = Array.from({ length: r }, () => new Array(c).fill(-1)); let best = -1, bestN = 0, id = 0;
    for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) {
      if (!ins[j][i] || comp[j][i] >= 0) continue;
      const q = [[i, j]]; comp[j][i] = id;
      for (let k = 0; k < q.length; k++) for (const d of [N, E, S, W]) {
        const nx = q[k][0] + DX[d], ny = q[k][1] + DY[d];
        if (nx >= 0 && ny >= 0 && nx < c && ny < r && ins[ny][nx] && comp[ny][nx] < 0) { comp[ny][nx] = id; q.push([nx, ny]); }
      }
      if (q.length > bestN) { bestN = q.length; best = id; } id++;
    }
    if (bestN < c * r * 0.25) return null;
    return ins.map((row, j) => row.map((v, i) => v && comp[j][i] === best));
  }

  // 미로 만드는 방식 3가지 (맵 모양이 매번 달라진다)
  const KINDS = [
    { id: 'dfs', name: '구불구불 길' },     // 길고 깊게 굽이치는 길
    { id: 'prim', name: '갈래갈래 길' },    // 짧은 갈래가 많은 길
    { id: 'rooms', name: '방방이 길' },     // 곧은 벽으로 방을 나눈 길
  ];
  function build(c, r, kind, braid, ins) {
    const open = Array.from({ length: r }, () => new Array(c).fill(0));
    const inb = (x, y) => x >= 0 && y >= 0 && x < c && y < r && ins[y][x];
    const link = (x, y, d) => { open[y][x] |= d; open[y + DY[d]][x + DX[d]] |= OPP[d]; };
    if (kind === 'rooms') {                                   // 전부 뚫어 놓고 곧은 벽을 세우며 나눈다(구멍 하나씩)
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { if (x < c - 1) link(x, y, E); if (y < r - 1) link(x, y, S); }   // (사각형에서만 쓴다)
      const rnd = (n) => (Math.random() * n) | 0;
      const divide = (x, y, w, h) => {
        if (w < 2 || h < 2) return;
        if (w < h || (w === h && Math.random() < 0.5)) {      // 가로 벽
          const wy = y + rnd(h - 1), gap = x + rnd(w);
          for (let i = x; i < x + w; i++) if (i !== gap) { open[wy][i] &= ~S; open[wy + 1][i] &= ~N; }
          divide(x, y, w, wy - y + 1); divide(x, wy + 1, w, y + h - wy - 1);
        } else {                                              // 세로 벽
          const wx = x + rnd(w - 1), gap = y + rnd(h);
          for (let j = y; j < y + h; j++) if (j !== gap) { open[j][wx] &= ~E; open[j][wx + 1] &= ~W; }
          divide(x, y, wx - x + 1, h); divide(wx + 1, y, x + w - wx - 1, h);
        }
      };
      divide(0, 0, c, r);
    } else {
      const seen = Array.from({ length: r }, () => new Array(c).fill(false));
      if (kind === 'prim') {                                  // 방문한 칸의 가장자리 벽 중 아무거나 골라 뚫는다
        const cells = []; for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (ins[y][x]) cells.push([x, y]);
        const [sx, sy] = G.pick(cells), fr = [];
        const add = (x, y) => { seen[y][x] = true; for (const d of [N, E, S, W]) if (inb(x + DX[d], y + DY[d])) fr.push([x, y, d]); };
        add(sx, sy);
        while (fr.length) {
          const i = (Math.random() * fr.length) | 0, [x, y, d] = fr[i]; fr[i] = fr[fr.length - 1]; fr.pop();
          const nx = x + DX[d], ny = y + DY[d];
          if (!seen[ny][nx]) { link(x, y, d); add(nx, ny); }
        }
      } else {                                                // 깊이 우선(스택)
        const cells = []; for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (ins[y][x]) cells.push([x, y]);
        const s0 = G.pick(cells), st = [s0]; seen[s0[1]][s0[0]] = true;
        while (st.length) {
          const [x, y] = st[st.length - 1];
          const ds = G.shuffle([N, E, S, W]).filter((d) => { const nx = x + DX[d], ny = y + DY[d]; return inb(nx, ny) && !seen[ny][nx]; });
          if (!ds.length) { st.pop(); continue; }
          const d = ds[0]; link(x, y, d); seen[y + DY[d]][x + DX[d]] = true; st.push([x + DX[d], y + DY[d]]);
        }
      }
    }
    if (braid > 0) {                                          // 막다른 길 일부를 터서 돌아갈 길을 만든다(쉬움)
      const bits = (o) => (o & 1) + ((o >> 1) & 1) + ((o >> 2) & 1) + ((o >> 3) & 1);
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
        if (!ins[y][x] || bits(open[y][x]) !== 1 || Math.random() > braid) continue;
        const ds = [N, E, S, W].filter((d) => !(open[y][x] & d) && inb(x + DX[d], y + DY[d]));
        if (ds.length) link(x, y, G.pick(ds));
      }
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

  // 어느 칸에서 가장 먼 칸 (길을 따라 센다)
  function farthest(open, c, r, from) {
    const dist = new Map([[from[1] * c + from[0], 0]]), q = [from]; let last = from;
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i]; last = q[i];
      for (const d of [N, E, S, W]) if (open[y][x] & d) {
        const nx = x + DX[d], ny = y + DY[d], k = ny * c + nx;
        if (!dist.has(k)) { dist.set(k, dist.get(y * c + x) + 1); q.push([nx, ny]); }
      }
    }
    return last;
  }

  G.register({
    id: 'maze', name: '미로찾기', desc: '길을 따라 가요', icon: '🧩', cat: 'play', color: 'lilac', variants: THEMES.length,
    start(root, { hard, v }) {
      const T = THEMES[v], short = SHORT[hard ? 'hard' : 'easy'];
      const box = G.h('div', { class: 'fitbox mazebox' }), cv = G.h('canvas', { class: 'maze', role: 'img', 'aria-label': '미로. 손가락으로 길을 따라 ' + T.w + '에게 가요' });
      box.append(cv);
      const musicBtn = G.h('button', { class: 'btn alt hintbtn', 'aria-pressed': 'true' }, ''), mv = G.h('span', {}, '👣 0'), kindTag = G.h('span', { class: 'kindtag' }, '');
      let hintBtn = null, hintLeft = 0, hintUsed = 0, hintTimer = 0, steps = 0, done = false;
      let c = 0, r = 0, open = null, pos = [0, 0], trail = [[0, 0]], hintPath = null, cell = 0, best = 1, start = [0, 0], goal = [0, 0], kind = KINDS[0], shape = SHAPES[0], ins = null;
      const ask = G.h('div', { class: 'hint must' }, `${T.p} 길을 따라 ${T.g} ${T.w}에게 가요`);

      const PAD = 7;                                               // 바깥 벽 선이 잘리지 않도록 둘레를 비운다
      function make() {
        const bw = (box.clientWidth || 600) - PAD * 2, bh = (box.clientHeight || 400) - PAD * 2;
        shape = SHAPES[G.nextVariant('maze-shape', SHAPES.length)]; ins = null;
        if (shape.id !== 'rect') {                                   // 도형: 정사각형 격자, 손가락이 닿기 좋은 칸 크기(≥26px) 유지
          const n = Math.max(7, Math.min(hard ? 17 : 11, Math.floor(Math.min(bw, bh) / 26)));
          c = r = n; ins = maskFor(shape, c, r);
        }
        if (!ins) {                                                  // 사각형: 상자 모양에 맞춘다
          shape = SHAPES[0]; const s = Math.min(bw, bh) / short;
          c = Math.max(3, Math.floor(bw / s)); r = Math.max(3, Math.floor(bh / s));
          c = Math.min(c, Math.ceil(r * 1.8)); r = Math.min(r, Math.ceil(c * 1.8));   // 너무 길쭉한 미로는 피한다
          ins = Array.from({ length: r }, () => new Array(c).fill(true));
        }
        const kinds = shape.id === 'rect' ? KINDS : KINDS.slice(0, 2);   // 방방이 길은 사각형에서만
        kind = kinds[G.nextVariant('maze-kind' + kinds.length, kinds.length)];
        open = build(c, r, kind.id, hard ? 0 : 0.5, ins);
        const cells = []; for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (ins[y][x]) cells.push([x, y]);
        const a = farthest(open, c, r, G.pick(cells)), z = farthest(open, c, r, a);   // 길로 가장 먼 두 칸이 출발·도착
        [start, goal] = Math.random() < 0.5 ? [a, z] : [z, a];
        pos = start.slice(); trail = [start.slice()]; steps = 0; hintPath = null; done = false;
        best = route(open, c, r, start, goal).length - 1;
        mv.textContent = '👣 0'; kindTag.textContent = shape.icon + ' ' + shape.name + ' · ' + kind.name;
      }
      function draw() {
        if (!open) return;
        const bw = box.clientWidth, bh = box.clientHeight;      // (방향 상수 W 와 이름이 겹치면 벽이 잘못 그려진다)
        if (!bw || !bh) return;
        cell = Math.floor(Math.min((bw - PAD * 2) / c, (bh - PAD * 2) / r)); const w = cell * c + PAD * 2, h = cell * r + PAD * 2;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        cv.style.width = w + 'px'; cv.style.height = h + 'px';
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr); x.clearRect(-PAD, -PAD, w, h);
        x.fillStyle = T.floor;
        for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) if (ins[j][i]) x.fillRect(i * cell - 0.5, j * cell - 0.5, cell + 1, cell + 1);
        x.fillStyle = 'rgba(255,190,90,.5)'; x.fillRect(goal[0] * cell, goal[1] * cell, cell, cell);
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
          if (!ins[j][i]) continue;
          const o = open[j][i], x0 = i * cell, y0 = j * cell;
          if (!(o & N)) { x.moveTo(x0, y0); x.lineTo(x0 + cell, y0); }
          if (!(o & W)) { x.moveTo(x0, y0); x.lineTo(x0, y0 + cell); }
          if (!(o & S)) { x.moveTo(x0, y0 + cell); x.lineTo(x0 + cell, y0 + cell); }
          if (!(o & E)) { x.moveTo(x0 + cell, y0); x.lineTo(x0 + cell, y0 + cell); }
        }
        x.strokeStyle = T.wall; x.lineWidth = Math.min(12, Math.max(3, cell * 0.11)); x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Math.floor(cell * 0.66)}px ${FONT}`;
        const g = mid(goal); x.fillText(T.g, g[0], g[1] + cell * 0.03);
        const p = mid(pos); x.fillText(T.p, p[0], p[1] + cell * 0.03);
      }

      function step(d) {
        if (done || !(open[pos[1]][pos[0]] & d)) return false;
        const n = [pos[0] + DX[d], pos[1] + DY[d]], pv = trail[trail.length - 2];
        if (pv && pv[0] === n[0] && pv[1] === n[1]) trail.pop(); else trail.push(n);
        pos = n; steps++; mv.textContent = '👣 ' + steps; G.sfx.flip(); hintPath = null; draw();
        if (n[0] === goal[0] && n[1] === goal[1]) finish();
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
        done = true; clearTimeout(hintTimer); G.music.stop();            // 음악은 잠깐 멈추고 박수 소리를 들려준다
        const ratio = steps / Math.max(1, best);
        let st = ratio <= 1.5 ? 3 : ratio <= 2.5 ? 2 : 1;
        st = Math.max(1, st - (hintUsed ? 1 : 0));
        setTimeout(() => G.win({ stars: st, text: `${T.p} ${T.g} ${steps}걸음!` + (hintUsed ? ' (힌트를 썼어요)' : '') }), 350);
      }

      let drag = false;
      const at = (e) => { const b = cv.getBoundingClientRect(); return [Math.floor((e.clientX - b.left - PAD) / cell), Math.floor((e.clientY - b.top - PAD) / cell)]; };
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
        hintUsed++; G.sfx.tap(); hintPath = route(open, c, r, pos, goal); draw();
        clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintPath = null; draw(); }, 2500);
      } }, '💡 힌트');
      root.append(ask, G.h('div', { class: 'hud' }, mv, hintBtn, musicBtn, kindTag), box);

      const showMusic = () => { musicBtn.textContent = G.music.isOn() ? '🎵 음악' : '🔇 음악'; musicBtn.setAttribute('aria-pressed', String(G.music.isOn())); };
      musicBtn.addEventListener('click', () => { G.sfx.tap(); G.music.setOn(!G.music.isOn()); showMusic(); });
      showMusic(); G.music.play(hard);

      make(); draw();
      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
      if (ro) ro.observe(box);
      requestAnimationFrame(() => { make(); draw(); });          // 상자 크기가 정해진 뒤 한 번 더 맞춘다
      return () => { removeEventListener('keydown', onKey); clearTimeout(hintTimer); G.music.stop(); if (ro) ro.disconnect(); };
    },
  });
})();
