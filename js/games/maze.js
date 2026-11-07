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

  // 난이도 3단계: short=사각형 짧은 쪽 칸 수, n=도형 한 변 칸 수, minCell=손가락 기준 최소 칸 크기(px)
  // 방해꾼(닿으면 처음부터): foes=[최소,최대] 마릿수, ms=한 칸 가는 시간, guards=길목을 지키는 방해꾼 최대 수, chasers=쫓아오는 방해꾼 수
  //  - wander 🐛: 길을 아무 데나 돌아다닌다   - guard 🕷️: 길목(갈림길)에서 옆길을 드나들며 길을 막는다(옆길에 들어간 틈에 지나간다)
  //  - chase 🦂: 가까이 있으면 쫓아온다
  const LV = [
    { short: 6, n: 11, minCell: 26, braid: 0.5, foes: [2, 3], ms: 900, guards: 0, chasers: 0, chase: 0 },
    { short: 11, n: 17, minCell: 26, braid: 0, foes: [5, 6], ms: 650, guards: 3, chasers: 0, chase: 0 },
    { short: 15, n: 23, minCell: 20, braid: 0, foes: [7, 8], ms: 450, guards: 5, chasers: 2, chase: 0.6 },
  ];
  const FOE = { wander: '🐛', guard: '🕷️', chase: '🦂' };
  const LVNAME = ['🙂 쉬워요', '🔥 어려워요', '💀 매우 어려워요'];

  // 어느 칸에서 각 칸까지의 길 거리
  function distFrom(open, c, r, from) {
    const dist = new Map([[from[1] * c + from[0], 0]]), q = [from];
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      for (const d of [N, E, S, W]) if (open[y][x] & d) {
        const nx = x + DX[d], ny = y + DY[d], k = ny * c + nx;
        if (!dist.has(k)) { dist.set(k, dist.get(y * c + x) + 1); q.push([nx, ny]); }
      }
    }
    return dist;
  }

  G.register({
    id: 'maze', name: '미로찾기', desc: '길을 따라 가요', icon: '🧩', cat: 'play', color: 'lilac', variants: THEMES.length,
    start(root, { level, v }) {
      const T = THEMES[v], L = LV[level], me = G.games.find((g) => g.id === 'maze');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const box = G.h('div', { class: 'fitbox mazebox' }), cv = G.h('canvas', { class: 'maze', role: 'img', 'aria-label': '미로. 손가락으로 길을 따라 ' + T.w + '에게 가요' });
      const flash = G.h('div', { class: 'flash', hidden: true }, '💥 앗! 처음부터 다시!');
      box.append(cv, flash);
      const tool = (icon, label, fn) => G.h('button', { class: 'btn alt tool', 'aria-label': label, onclick: fn }, icon, G.h('span', { class: 'lbl' }, ' ' + label));
      const mv = G.h('span', {}, '👣 0'), hitTag = G.h('span', { title: '방해꾼에게 부딪힌 횟수' }, '💥 0'), kindTag = G.h('span', { class: 'kindtag' }, '');
      let hintUsed = 0, hintTimer = 0, steps = 0, done = false, hits = 0, lock = 0, inv = 0, foeTimer = 0, raf = 0, flashTimer = 0, drag = false;
      let distS = new Map(), c = 0, r = 0, open = null, pos = [0, 0], trail = [[0, 0]], hintPath = null, cell = 0, best = 1, start = [0, 0], goal = [0, 0], kind = KINDS[0], shape = SHAPES[0], ins = null, foes = [];
      const ask = G.h('div', { class: 'hint must' }, `${T.p} 길을 따라 ${T.g} ${T.w}에게 가요`);
      const now = () => performance.now();

      const PAD = 7;                                               // 바깥 벽 선이 잘리지 않도록 둘레를 비운다
      function make() {
        const bw = (box.clientWidth || 600) - PAD * 2, bh = (box.clientHeight || 400) - PAD * 2;
        shape = SHAPES[G.nextVariant('maze-shape', SHAPES.length)]; ins = null;
        if (shape.id !== 'rect') {                                   // 도형: 정사각형 격자, 손가락이 닿기 좋은 칸 크기 유지
          const n = Math.max(7, Math.min(L.n, Math.floor(Math.min(bw, bh) / L.minCell)));
          c = r = n; ins = maskFor(shape, c, r);
        }
        if (!ins) {                                                  // 사각형: 상자 모양에 맞춘다
          shape = SHAPES[0]; const sz = Math.min(bw, bh) / L.short;
          c = Math.max(3, Math.floor(bw / sz)); r = Math.max(3, Math.floor(bh / sz));
          c = Math.min(c, Math.ceil(r * 1.8)); r = Math.min(r, Math.ceil(c * 1.8));   // 너무 길쭉한 미로는 피한다
          ins = Array.from({ length: r }, () => new Array(c).fill(true));
        }
        const kinds = shape.id === 'rect' ? KINDS : KINDS.slice(0, 2);   // 방방이 길은 사각형에서만
        kind = kinds[G.nextVariant('maze-kind' + kinds.length, kinds.length)];
        open = build(c, r, kind.id, L.braid, ins);
        const cells = []; for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (ins[y][x]) cells.push([x, y]);
        const a = farthest(open, c, r, G.pick(cells)), z = farthest(open, c, r, a);   // 길로 가장 먼 두 칸이 출발·도착
        [start, goal] = Math.random() < 0.5 ? [a, z] : [z, a];
        pos = start.slice(); trail = [start.slice()]; steps = 0; hits = 0; hintPath = null; done = false;
        best = route(open, c, r, start, goal).length - 1;
        mv.textContent = '👣 0'; hitTag.textContent = '💥 0'; kindTag.textContent = shape.icon + ' ' + shape.name + ' · ' + kind.name;
        spawnFoes(cells);
      }

      // ───── 방해꾼 ─────
      function spawnFoes(cells) {
        foes = [];
        const key = (p) => p[1] * c + p[0], total = L.foes[0] + ((Math.random() * (L.foes[1] - L.foes[0] + 1)) | 0);
        const dist = distFrom(open, c, r, start), R = route(open, c, r, start, goal), onRoute = new Set(R.map(key)); distS = dist;
        const isEnd = (p) => (p[0] === goal[0] && p[1] === goal[1]) || (p[0] === start[0] && p[1] === start[1]);
        const nbrs = (p) => [N, E, S, W].filter((d) => open[p[1]][p[0]] & d).map((d) => [p[0] + DX[d], p[1] + DY[d]]);
        const taken = new Set(), mk = (kind, path, idx) => { const p = path[idx]; return { kind, cell: p.slice(), prev: p.slice(), last: null, t0: 0, home: p.slice(), path, idx, idx0: idx, dir: 1 }; };
        // 1) 길목 지킴이: 갈림길 B 에서 [옆길 깊숙이 … B … 길 앞쪽 몇 칸] 을 왕복한다
        const cand = []; for (let i = 3; i < R.length - 3; i++) if (nbrs(R[i]).some((n) => !onRoute.has(key(n)))) cand.push(i);
        const gi = [];
        for (const i of G.shuffle(cand)) {
          if (gi.length >= Math.min(L.guards, total)) break;
          if (gi.some((j) => Math.abs(j - i) < 6)) continue;                       // 지킴이 사이에 숨 돌릴 길을 둔다
          const side = G.pick(nbrs(R[i]).filter((n) => !onRoute.has(key(n)))), branch = [side], seen = new Set([key(R[i]), key(side)]), depth = 2 + ((Math.random() * 3) | 0);
          while (branch.length < depth) {
            const nx = nbrs(branch[branch.length - 1]).filter((n) => !onRoute.has(key(n)) && !seen.has(key(n)));
            if (!nx.length) break; const n = G.pick(nx); branch.push(n); seen.add(key(n));
          }
          const ahead = []; for (let j = 1, k = 1 + ((Math.random() * 3) | 0); j <= k && i + j < R.length - 2; j++) ahead.push(R[i + j]);
          const path = branch.slice().reverse().concat([R[i]], ahead);
          if (path.some((p) => isEnd(p) || taken.has(key(p)) || dist.get(key(p)) < 4)) continue;
          path.forEach((p) => taken.add(key(p))); gi.push(i); foes.push(mk('guard', path, (Math.random() * path.length) | 0));
        }
        // 2) 쫓는 방해꾼과 떠돌이: 출발에서 멀리, 서로 떨어뜨려 놓는다(떠돌이는 길 위에 더 자주 놓아 길을 막게 한다)
        let pool = cells.filter((p) => !isEnd(p) && !taken.has(key(p)) && dist.get(key(p)) >= Math.max(6, best * 0.25));
        if (pool.length < total) pool = cells.filter((p) => !isEnd(p) && !taken.has(key(p)) && dist.get(key(p)) >= 4);
        const onR = G.shuffle(pool.filter((p) => onRoute.has(key(p)))), offR = G.shuffle(pool.filter((p) => !onRoute.has(key(p))));
        const order = []; for (let i = 0; i < Math.max(onR.length, offR.length); i++) { if (level >= 1 && i < onR.length) order.push(onR[i]); if (i < offR.length) order.push(offR[i]); }   // 길 위와 옆길에 번갈아 놓는다(너무 빽빽하지 않게)
        if (level < 1) order.sort(() => Math.random() - 0.5);
        const far = (p, k) => foes.every((f) => Math.abs(f.home[0] - p[0]) + Math.abs(f.home[1] - p[1]) >= k);
        const chasers = Math.min(L.chasers, Math.max(0, total - foes.length));
        const kinds = Array(chasers).fill('chase').concat(Array(Math.max(0, total - foes.length - chasers)).fill('wander'));
        for (const k of [3, 2, 1, 0]) for (const p of order) {
          if (!kinds.length) break; if (taken.has(key(p)) || !far(p, k)) continue;
          taken.add(key(p)); foes.push(mk(kinds.shift(), [p], 0));
        }
      }
      function foeStep() {
        if (done || !open) return;
        const t = now();
        for (const f of foes) {
          let nx = null;
          if (f.kind === 'guard') {                                    // 정해진 길을 왕복한다
            if (f.idx + f.dir < 0 || f.idx + f.dir >= f.path.length) f.dir = -f.dir;
            f.idx += f.dir; nx = f.path[f.idx];
          } else {
            const here = f.cell, nb = [];
            for (const d of [N, E, S, W]) if (open[here[1]][here[0]] & d) {
              const n = [here[0] + DX[d], here[1] + DY[d]];
              if ((n[0] === goal[0] && n[1] === goal[1]) || (distS.get(n[1] * c + n[0]) || 0) < 3) continue;   // 도착 칸과 출발 칸 둘레(2칸)에는 못 들어간다
              nb.push(n);
            }
            if (!nb.length) continue;
            if (f.kind === 'chase' && Math.random() < L.chase) {        // 가까이 있으면 쫓아온다
              const pa = route(open, c, r, here, pos);
              if (pa && pa.length > 1 && pa.length <= 11 && nb.some((n) => n[0] === pa[1][0] && n[1] === pa[1][1])) nx = pa[1];
            }
            if (!nx) { const fw = nb.filter((n) => !(f.last && n[0] === f.last[0] && n[1] === f.last[1])); nx = G.pick(fw.length ? fw : nb); }   // 되돌아가지 않고 돌아다닌다
          }
          f.last = f.cell; f.prev = f.cell; f.cell = nx; f.t0 = t;
        }
        check();
      }
      function check() { if (!done && now() >= inv && foes.some((f) => f.cell[0] === pos[0] && f.cell[1] === pos[1])) hit(); }
      function hit() {                                               // 부딪히면 처음부터 다시
        hits++; hitTag.textContent = '💥 ' + hits; G.sfx.bad();
        pos = start.slice(); trail = [start.slice()]; steps = 0; mv.textContent = '👣 0'; hintPath = null; drag = false;
        for (const f of foes) { f.idx = f.idx0; f.dir = 1; f.cell = f.home.slice(); f.prev = f.home.slice(); f.last = null; f.t0 = 0; }
        inv = now() + 1500; lock = now() + 700;                      // 잠깐은 다시 부딪히지 않고, 손가락 입력도 잠깐 무시한다
        flash.hidden = false; clearTimeout(flashTimer); flashTimer = setTimeout(() => { flash.hidden = true; }, 900);
        draw();
      }
      function loop() { raf = 0; if (done || !foes.length) return; draw(); raf = requestAnimationFrame(loop); }

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
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Math.max(14, Math.floor(cell * 0.7))}px ${FONT}`;
        const disc = (m, fill, ring, k) => { x.fillStyle = fill; x.strokeStyle = ring; x.lineWidth = Math.max(2, cell * 0.05); x.beginPath(); x.arc(m[0], m[1], cell * (k || 0.39), 0, Math.PI * 2); x.fill(); x.stroke(); };
        const g = mid(goal); disc(g, 'rgba(255,214,120,.95)', '#f0a000'); x.fillText(T.g, g[0], g[1] + cell * 0.03);
        // 방해꾼(한 칸을 부드럽게 미끄러져 간다)
        const t = now();
        for (const f of foes) {
          const u = reduce || !f.t0 ? 1 : Math.min(1, (t - f.t0) / (L.ms * 0.85));
          const m = mid([f.prev[0] + (f.cell[0] - f.prev[0]) * u, f.prev[1] + (f.cell[1] - f.prev[1]) * u]);
          x.globalAlpha = t < inv ? 0.5 : 1;
          disc(m, '#ffd6d6', '#e53935', 0.4); x.fillText(FOE[f.kind], m[0], m[1] + cell * 0.03);
          x.globalAlpha = 1;
        }
        const p = mid(pos); disc(p, '#ffffff', '#ff7aa8'); x.fillText(T.p, p[0], p[1] + cell * 0.03);
      }

      function step(d) {
        if (done || now() < lock || !(open[pos[1]][pos[0]] & d)) return false;
        const n = [pos[0] + DX[d], pos[1] + DY[d]], pv = trail[trail.length - 2];
        if (pv && pv[0] === n[0] && pv[1] === n[1]) trail.pop(); else trail.push(n);
        pos = n; steps++; mv.textContent = '👣 ' + steps; G.sfx.flip(); hintPath = null; draw();
        if (n[0] === goal[0] && n[1] === goal[1]) finish(); else check();
        return true;
      }
      function moveTo(tx, ty) {                                       // 가까운 칸이면 벽을 따라 걸어간다
        if (tx < 0 || ty < 0 || tx >= c || ty >= r || (tx === pos[0] && ty === pos[1])) return;
        const path = route(open, c, r, pos, [tx, ty]);
        if (!path || path.length > 5) return;
        for (let i = 1; i < path.length && !done && now() >= lock; i++) {
          const a = path[i - 1], b = path[i];
          step(DX[N] === b[0] - a[0] && DY[N] === b[1] - a[1] ? N : b[0] > a[0] ? E : b[0] < a[0] ? W : b[1] > a[1] ? S : N);
        }
      }
      function finish() {
        done = true; clearTimeout(hintTimer); clearInterval(foeTimer); G.music.stop();      // 음악은 잠깐 멈추고 박수 소리를 들려준다
        const ratio = steps / Math.max(1, best);
        let st = ratio <= 1.5 ? 3 : ratio <= 2.5 ? 2 : 1;
        st = Math.max(1, st - (hintUsed ? 1 : 0) - (hits >= 3 ? 1 : 0));
        setTimeout(() => G.win({ stars: st, text: `${T.p} ${T.g} ${steps}걸음!` + (hintUsed ? ' (힌트를 썼어요)' : '') + (hits ? ` · 💥 ${hits}번 부딪혔어요` : '') }), 350);
      }

      const at = (e) => { const b = cv.getBoundingClientRect(); return [Math.floor((e.clientX - b.left - PAD) / cell), Math.floor((e.clientY - b.top - PAD) / cell)]; };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} const t = at(e); moveTo(t[0], t[1]); });
      cv.addEventListener('pointermove', (e) => { if (drag) { const t = at(e); moveTo(t[0], t[1]); } });
      const up = () => { drag = false; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      const KEYS = { ArrowUp: N, ArrowRight: E, ArrowDown: S, ArrowLeft: W, w: N, d: E, s: S, a: W };
      const onKey = (e) => { const d = KEYS[e.key]; if (d) { e.preventDefault(); step(d); } };
      addEventListener('keydown', onKey);

      // 왼쪽(세로 화면에선 위쪽) 메뉴: 단계 · 도구 · 안내
      const hintBtn = tool('💡', '힌트', () => {                      // 지금 자리에서 도착점까지 길을 잠깐 보여 준다 (별 1개 줄어듦)
        if (done) return;
        hintUsed++; G.sfx.tap(); hintPath = route(open, c, r, pos, goal); draw();
        clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintPath = null; draw(); }, 2500);
      });
      const musicBtn = tool('🎵', '음악', () => { G.sfx.tap(); G.music.setOn(!G.music.isOn()); showMusic(); });
      const refreshBtn = tool('🔄', '새로', () => { G.sfx.tap(); G.start(me); });
      const showMusic = () => { musicBtn.firstChild.textContent = G.music.isOn() ? '🎵' : '🔇'; musicBtn.setAttribute('aria-pressed', String(G.music.isOn())); };
      const modes = G.h('div', { class: 'modes' }, LVNAME.map((n, i) => G.h('button', { class: 'mode', 'aria-pressed': String(i === level), onclick: () => G.setLevel(i) }, n)));
      const side = G.h('div', { class: 'side' }, modes, G.h('div', { class: 'tools' }, hintBtn, musicBtn, refreshBtn), ask, G.h('div', { class: 'info' }, mv, hitTag, kindTag));
      root.classList.add('mz'); root.append(side, box);
      showMusic(); G.music.play(level >= 1, level === 2 ? 1.1 : 1);

      make(); draw();
      foeTimer = setInterval(foeStep, L.ms); raf = requestAnimationFrame(loop);
      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
      if (ro) ro.observe(box);
      requestAnimationFrame(() => { make(); draw(); });          // 상자 크기가 정해진 뒤 한 번 더 맞춘다
      return () => { removeEventListener('keydown', onKey); clearTimeout(hintTimer); clearTimeout(flashTimer); clearInterval(foeTimer); cancelAnimationFrame(raf); G.music.stop(); if (ro) ro.disconnect(); };
    },
  });
})();
