// 공통 도우미: 요소 만들기, 저장, 소리, 별, 화면 전환, 결과 창
(function () {
  'use strict';
  const G = (window.G = { games: [], cats: [
    { id: 'all', name: '전체', icon: '🎈' },
    { id: 'draw', name: '그리기', icon: '🎨' },
    { id: 'match', name: '찾기·맞추기', icon: '🔍' },
    { id: 'play', name: '놀이', icon: '🎮' },
    { id: 'race', name: '달리기', icon: '🏁' },
  ] });

  G.register = (g) => G.games.push(g);
  G.$ = (s, r = document) => r.querySelector(s);

  G.h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null) e.append(c);
    return e;
  };

  G.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.pick = (a) => a[(Math.random() * a.length) | 0];

  // 저장 (시크릿 모드 등에서 막혀도 동작)
  G.store = {
    get(k, d) { try { const v = localStorage.getItem('miro:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('miro:' + k, JSON.stringify(v)); } catch (e) {} },
  };

  // 소리 (파일 없이 직접 만든다)
  let ac = null;
  G.soundOn = G.store.get('sound', true);
  function ctx() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  G.audioCtx = ctx;
  function tone(f, t0, d, type, v) {
    const c = G.soundOn && ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t0;
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(v || 0.15, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + d + 0.03);
  }
  G.sfx = {
    tap: () => tone(660, 0, 0.08, 'triangle'),
    pop: () => tone(520, 0, 0.1, 'square', 0.07),
    flip: () => tone(440, 0, 0.07, 'triangle'),
    ok: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.18, 'triangle'); },
    bad: () => tone(200, 0, 0.2, 'sawtooth', 0.07),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.28, 'triangle')),
  };
  G.speak = (t) => {
    if (!G.soundOn || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) {}
  };
  G.setSound = (on) => { G.soundOn = on; G.store.set('sound', on); if (G.music) G.music.onSound(on); G.$('#btnSound').textContent = on ? '🔊' : '🔇'; if (!on && 'speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} };

  // 난이도(쉬움/어려움)와 문제 종류(20가지)를 섞어서 뽑는다
  const LEVELS = ['쉬워요', '어려워요', '매우 어려워요'];
  G.levels = LEVELS;
  G.level = Math.max(0, Math.min(2, +G.store.get('level', 0) || 0));
  G.hard = G.level >= 1;
  const bags = {}, lastV = {};
  G.nextVariant = (id, n) => {
    let b = bags[id];
    if (!b || !b.length) { b = G.shuffle([...Array(n).keys()]); if (n > 1 && b[b.length - 1] === lastV[id]) b.unshift(b.pop()); bags[id] = b; }
    const v = b.pop(); lastV[id] = v; return v;
  };
  // n칸을 상자(box)에 가장 크게 넣는 열·행 수
  G.bestGrid = (n, box) => {
    const r0 = box.getBoundingClientRect(), W = r0.width || 600, H = r0.height || 400;
    let best = null;
    for (let c = 1; c <= Math.min(n, 8); c++) { const r = Math.ceil(n / c), s = Math.min(W / c, H / r); if (!best || s > best.s + 1e-6) best = { c, r, s }; }
    return best;
  };

  // 별
  G.starCount = G.store.get('stars', 0);
  G.showStars = () => { G.$('#stars').textContent = '⭐ ' + G.starCount; };
  G.addStars = (n) => { G.starCount += n; G.store.set('stars', G.starCount); G.showStars(); };

  // 화면 전환
  let stop = null, current = null;
  const stage = () => G.$('#stage');
  function cleanup() { if (stop) { try { stop(); } catch (e) {} stop = null; } if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} }

  // 새로고침해도 이 서비스에 머물도록, 지금 보는 게임을 주소(#게임이름)에 기억한다. 기록을 늘리지 않아 '뒤로'는 그대로 허브로 간다.
  const remember = (id) => { try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch (e) {} };
  G.home = () => {
    cleanup(); current = null; remember(null);
    document.body.dataset.view = 'home';
    G.$('#title').textContent = '놀이터';
    renderHome(G.store.get('cat', 'all'));
  };

  G.start = (g, forceV) => {
    cleanup(); current = g; remember(g.id);
    document.body.dataset.view = 'game';
    G.$('#title').textContent = g.name;
    const root = G.h('div', { class: 'game' });
    stage().replaceChildren(root);
    const n = g.variants || 1, v = forceV != null ? forceV : G.nextVariant(g.id, n);
    stop = g.start(root, { hard: G.hard, level: G.level, v, n }) || null;
  };
  G.setLevel = (lv) => { if (lv === G.level || !current) return; G.level = lv; G.hard = lv >= 1; G.store.set('level', lv); G.sfx.tap(); G.start(current); };

  // 결과 창: { stars:1~3, text }
  G.win = ({ stars = 1, text = '', ask = null } = {}) => {
    const bonus = G.level || 0;
    G.addStars(stars + bonus);
    G.sfx.win(); G.speak('참 잘했어요!');
    const g = current, close = (fn) => () => { over.remove(); if (fn) fn(); };
    const over = G.h('div', { class: 'over' },
      G.h('h2', {}, '참 잘했어요! 🎉'),
      G.h('div', { class: 'bigstars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
      text ? G.h('div', { class: 'hint must' }, text) : null,
      bonus ? G.h('div', { class: 'hint must' }, (bonus > 1 ? '💀 매우 어려움 보너스 ⭐ +' : '🔥 어려움 보너스 ⭐ +') + bonus) : null,
      ask ? G.h('div', { class: 'hint must ask' }, ask.q) : null,
      G.h('div', { class: 'row' }, ask
        ? [G.h('button', { class: 'btn', onclick: close(ask.yes.fn) }, ask.yes.label), G.h('button', { class: 'btn alt', onclick: close(ask.no.fn) }, ask.no.label)]
        : [G.h('button', { class: 'btn', onclick: () => g && G.start(g) }, '다음 문제'), G.h('button', { class: 'btn alt', onclick: G.home }, '메뉴')]));
    stage().append(over);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const em = ['🎈', '⭐', '🎉', '🌈', '🍭', '🎀'];
      for (let i = 0; i < 14; i++) {
        const c = G.h('span', { class: 'confetti' }, G.pick(em));
        c.style.left = Math.random() * 95 + '%'; c.style.animationDuration = 2 + Math.random() * 2 + 's'; c.style.animationDelay = Math.random() * 0.6 + 's';
        over.append(c);
      }
    }
  };

  function renderHome(cat) {
    const list = G.games.filter((g) => cat === 'all' || g.cat === cat);
    const tabs = G.h('div', { class: 'tabs' }, G.cats.map((c) =>
      G.h('button', { class: 'tab', 'aria-pressed': String(c.id === cat), onclick: () => { G.sfx.tap(); G.store.set('cat', c.id); renderHome(c.id); } }, c.icon + ' ' + c.name)));
    const cards = G.h('div', { class: 'cards' }, list.map((g) =>
      G.h('button', { class: 'card c-' + g.color, onclick: () => { G.sfx.tap(); G.start(g); } },
        G.h('span', { class: 'ic' }, g.icon), G.h('span', { class: 'nm' }, g.name), G.h('span', { class: 'ds' }, g.desc))));
    stage().replaceChildren(G.h('div', { class: 'home' }, tabs, cards));
    layoutCards(cards, list.length);
  }

  // 카드 수와 화면 방향에 맞춰 열 수를 정한다 (한 화면에 맞추기)
  function layoutCards(cards, n) {
    const land = innerWidth > innerHeight * 1.05 && innerWidth > 640;
    const maxCols = land ? 4 : 2;
    const rows = Math.ceil(n / maxCols);
    cards.style.setProperty('--cols', Math.ceil(n / rows) || 1);
  }
  // 주소의 #게임이름 으로 화면을 정한다 (새로고침·직접 열기)
  G.route = () => { const id = decodeURIComponent((location.hash || '').slice(1)), g = G.games.find((x) => x.id === id); if (g) { if (current !== g) G.start(g); } else G.home(); };
  addEventListener('hashchange', () => G.route());
  addEventListener('resize', () => { const c = G.$('.cards'); if (c) layoutCards(c, c.children.length); });
})();
