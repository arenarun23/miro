// 미로 음악: 파일 없이 웹오디오로 직접 연주한다(저작물 없음). 칩튠(사각파 멜로디·베이스·드럼) 느낌.
// 쉬움 4곡(밝고 느긋한 장조) · 어려움 4곡(빠르고 힘 있는 단조). 한 곡이 끝나면 다음 곡으로 끊김 없이 이어지고, 마지막 곡 다음엔 처음으로 돌아간다.
// 곡 하나 = 16마디: A(4) A(4) B(4) A'(끝 마디만 바꿈). 마디는 16칸(16분음표) — 멜로디는 "음이름옥타브:길이" 로 적는다(r = 쉼).
(function () {
  'use strict';
  const G = window.G;
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const noteMidi = (n) => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) throw new Error('음 이름 오류: ' + n); return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  function chordOf(name) {                       // 'Am' → 베이스 뿌리와 3화음
    const m = /^([A-G])([#b]?)(m?)$/.exec(name); if (!m) throw new Error('코드 오류: ' + name);
    const pc = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, minor = !!m[3];
    return { root: 36 + pc, third: minor ? 3 : 4 };
  }
  const T = (name, bpm, A, Ac, B, Bc, end, endc) => ({ name, bpm, A, Ac, B, Bc, end, endc });

  const TRACKS = {
    easy: [
      T('아침 산책', 108,
        ['E5:4 G5:2 E5:2 C5:4 E5:4', 'A4:4 C5:2 E5:2 A5:4 E5:4', 'A5:4 F5:2 A5:2 C6:4 A5:4', 'G5:4 B5:2 G5:2 D5:4 B4:4'], ['C', 'Am', 'F', 'G'],
        ['F5:2 A5:2 C6:4 A5:2 F5:2 A5:4', 'G5:2 B5:2 D6:4 B5:2 G5:2 D5:4', 'E5:2 G5:2 B5:4 G5:2 E5:2 G5:4', 'C6:4 B5:2 A5:2 G5:4 E5:4'], ['F', 'G', 'Em', 'Am'],
        'C5:2 E5:2 G5:2 E5:2 C6:8', 'C'),
      T('통통 놀이터', 112,
        ['D5:3 G5:3 B5:2 A5:3 G5:3 B5:2', 'G5:3 E5:3 B4:2 E5:4 G5:4', 'E5:3 G5:3 C6:2 B5:3 G5:3 E5:2', 'F#5:3 A5:3 D6:2 C#6:4 A5:4'], ['G', 'Em', 'C', 'D'],
        ['C6:4 G5:2 E5:2 C6:4 G5:4', 'D6:4 A5:2 F#5:2 D6:4 A5:4', 'B5:3 D6:3 F#6:2 D6:4 B5:4', 'G5:2 B5:2 E6:4 D6:2 B5:2 G5:4'], ['C', 'D', 'Bm', 'Em'],
        'G5:2 B5:2 D6:2 B5:2 G5:8', 'G'),
      T('구름 위로', 100,
        ['C6:6 A5:2 F5:4 A5:4', 'D6:6 A5:2 F5:4 D5:4', 'D6:4 F6:4 D6:4 Bb5:4', 'C6:4 E6:4 C6:4 G5:4'], ['F', 'Dm', 'Bb', 'C'],
        ['Bb5:2 D6:2 F6:4 D6:2 Bb5:2 D6:4', 'C6:2 E6:2 G6:4 E6:2 C6:2 E6:4', 'A5:2 C6:2 E6:4 C6:2 A5:2 C6:4', 'D6:4 C6:2 A5:2 F5:4 A5:4'], ['Bb', 'C', 'Am', 'Dm'],
        'F5:4 A5:4 C6:8', 'F'),
      T('별빛 길', 108,
        ['D5:2 F#5:2 A5:2 D6:2 A5:2 F#5:2 D5:2 F#5:2', 'B4:2 D5:2 F#5:2 B5:2 F#5:2 D5:2 B4:2 D5:2', 'G4:2 B4:2 D5:2 G5:2 D5:2 B4:2 G5:4', 'A4:2 C#5:2 E5:2 A5:2 E5:2 C#5:2 E5:4'], ['D', 'Bm', 'G', 'A'],
        ['B5:4 A5:2 G5:2 B5:4 D6:4', 'C#6:4 B5:2 A5:2 C#6:4 E6:4', 'A5:4 F#5:2 A5:2 C#6:4 A5:4', 'D6:4 B5:2 D6:2 F#6:4 D6:4'], ['G', 'A', 'F#m', 'Bm'],
        'D6:2 A5:2 F#5:2 A5:2 D6:8', 'D'),
    ],
    hard: [
      T('달려라 미로', 140,
        ['A4:2 C5:2 E5:4 A5:2 G5:2 E5:4', 'A5:3 E5:3 C5:2 E5:4 A4:4', 'F5:2 A5:2 C6:4 A5:2 F5:2 A5:4', 'G#5:2 B5:2 E6:4 B5:2 G#5:2 B5:4'], ['Am', 'Am', 'F', 'E'],
        ['D6:3 A5:3 F5:2 A5:4 D5:4', 'C6:3 A5:3 E5:2 A5:4 C5:4', 'B5:2 G#5:2 E5:2 G#5:2 B5:4 E6:4', 'A5:4 E5:2 A5:2 C6:8'], ['Dm', 'Am', 'E', 'Am'],
        'A5:2 E5:2 C5:2 E5:2 A4:8', 'Am'),
      T('빙글빙글 탈출', 146,
        ['D5:2 F5:2 A5:2 F5:2 D6:4 A5:4', 'Bb5:2 D6:2 F6:2 D6:2 Bb5:4 F5:4', 'C6:2 E6:2 G6:2 E6:2 C6:4 G5:4', 'C#6:2 E6:2 A5:2 E6:2 C#6:4 A5:4'], ['Dm', 'Bb', 'C', 'A'],
        ['G5:3 Bb5:3 D6:2 Bb5:4 G5:4', 'F5:3 A5:3 D6:2 A5:4 F5:4', 'E5:2 A5:2 C#6:4 E6:2 C#6:2 A5:4', 'D6:2 C6:2 A5:2 F5:2 D5:8'], ['Gm', 'Dm', 'A', 'Dm'],
        'D5:2 F5:2 A5:2 F5:2 D6:8', 'Dm'),
      T('어둠 속 지름길', 150,
        ['E5:3 G5:3 B5:2 G5:3 E5:3 G5:2', 'E5:3 G5:3 C6:2 G5:3 E5:3 G5:2', 'F#5:3 A5:3 D6:2 A5:3 F#5:3 A5:2', 'F#5:3 B5:3 D#6:2 B5:3 F#5:3 D#5:2'], ['Em', 'C', 'D', 'B'],
        ['A5:4 E5:2 A5:2 C6:4 B5:4', 'G5:4 E5:2 G5:2 B5:4 A5:4', 'D#6:4 B5:2 F#5:2 B5:4 D#6:4', 'E6:4 B5:2 G5:2 E5:8'], ['Am', 'Em', 'B', 'Em'],
        'E5:2 G5:2 B5:2 G5:2 E6:8', 'Em'),
      T('마지막 출구', 154,
        ['G5:2 Bb5:2 D6:2 Bb5:2 G6:4 D6:4', 'Eb6:2 G5:2 Bb5:2 G5:2 Eb6:4 Bb5:4', 'F5:2 A5:2 C6:2 A5:2 F6:4 C6:4', 'F#5:2 A5:2 D6:2 A5:2 F#6:4 D6:4'], ['Gm', 'Eb', 'F', 'D'],
        ['C6:3 Eb6:3 G6:2 Eb6:4 C6:4', 'Bb5:3 D6:3 G6:2 D6:4 Bb5:4', 'A5:2 D6:2 F#6:4 D6:2 A5:2 F#5:4', 'G5:2 Bb5:2 D6:4 G6:8'], ['Cm', 'Gm', 'D', 'Gm'],
        'G5:2 D5:2 Bb4:2 D5:2 G5:8', 'Gm'),
    ],
  };

  // 곡 하나를 마디 목록으로 펼친다: [{ ev:[16칸], chord }] × 16
  function parseBar(str) {
    const ev = new Array(16).fill(null); let s = 0;
    for (const tok of str.trim().split(/\s+/)) {
      const [n, l] = tok.split(':'), len = +l;
      if (!(len > 0)) throw new Error('길이 오류: ' + tok);
      if (n !== 'r') { if (s >= 16) throw new Error('마디가 16칸을 넘음: ' + str); ev[s] = { m: noteMidi(n), len }; }
      s += len;
    }
    if (s !== 16) throw new Error('마디가 16칸이 아님(' + s + '): ' + str);
    return ev;
  }
  function flatten(t, hard) {
    const A = t.A.map(parseBar), B = t.B.map(parseBar), end = parseBar(t.end), bars = [];
    const add = (evs, chords, g) => evs.forEach((ev, i) => bars.push({ ev, chord: chordOf(chords[i]), g }));
    add(A, t.Ac, 0); add(A, t.Ac, 1); add(B, t.Bc, 2);
    add(A.slice(0, 3).concat([end]), t.Ac.slice(0, 3).concat([t.endc]), 3);
    return { name: t.name, bpm: t.bpm, hard, bars };
  }
  const FLAT = { easy: TRACKS.easy.map((t) => flatten(t, false)), hard: TRACKS.hard.map((t) => flatten(t, true)) };

  // ───── 악기 ─────
  const noiseCache = new WeakMap();
  function noiseBuf(c) { let b = noiseCache.get(c); if (!b) { b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseCache.set(c, b); } return b; }
  function env(c, dest, t, dur, vol, a, r) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(dest); return g;
  }
  function osc(c, dest, type, f, t, dur, vol, o) {
    o = o || {}; const g = env(c, dest, t, dur, vol, 0.004, o.r != null ? o.r : 0.04);
    let node = g; if (o.lp) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.connect(g); node = lp; }
    for (const dt of o.det || [0]) { const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t); os.detune.value = dt; os.connect(node); os.start(t); os.stop(t + dur + 0.03); }
  }
  function nz(c, dest, t, dur, vol, type, freq, q) {
    const s = c.createBufferSource(); s.buffer = noiseBuf(c); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(c, dest, t, vol) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(135, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.2);
  }
  const snare = (c, d, t, v) => { nz(c, d, t, 0.13, v, 'bandpass', 1900, 0.7); osc(c, d, 'triangle', 190, t, 0.08, v * 0.7); };
  const hat = (c, d, t, v) => nz(c, d, t, 0.04, v, 'highpass', 7200);

  // 한 칸(16분음표)을 시각 t 에 연주한다. bar = 곡의 마디 번호(0~15), s = 마디 안 칸(0~15)
  function playStep(c, dest, tr, bar, s, t, rate) {
    const sd = 60 / (tr.bpm * (rate || 1)) / 4, b = tr.bars[bar], g = b.g, hard = tr.hard, ch = b.chord;
    // 멜로디
    const n = b.ev[s];
    if (n) {
      const dur = Math.max(0.06, n.len * sd * (hard ? 0.9 : 0.86)), f = mtof(n.m);
      osc(c, dest, 'square', f, t, dur, hard ? 0.15 : 0.13, { det: [-6, 6], lp: hard ? 5200 : 3600 });
      if (g === 2) osc(c, dest, 'triangle', f / 2, t, dur, 0.1);                 // B 부분은 한 옥타브 아래를 겹쳐 두껍게
    }
    // 베이스
    if (hard) { if (s % 2 === 0) osc(c, dest, 'square', mtof(ch.root + (s % 4 === 2 ? 12 : 0)), t, sd * 1.8, 0.2, { lp: 700, r: 0.03 }); }
    else if (s % 4 === 0) osc(c, dest, 'triangle', mtof(ch.root + (s % 8 === 4 ? 7 : 0)), t, sd * 3.4, 0.3, { r: 0.05 });
    // 아르페지오(둘째 번 A 부터)
    if (g >= 1) {
      const tones = [0, ch.third, 7, 12], k = hard ? s : s >> 1;
      if (hard || s % 2 === 0) osc(c, dest, 'square', mtof(ch.root + 24 + tones[[0, 1, 2, 3, 2, 1][k % 6]]), t, sd * (hard ? 0.9 : 1.6), hard ? 0.04 : 0.05, { lp: 2800, r: 0.02 });
    }
    // 드럼
    const last = bar === 15;
    if (hard) {
      if (s % 4 === 0) kick(c, dest, t, 0.42);
      if (g >= 1 && (s === 4 || s === 12)) snare(c, dest, t, 0.16);
      if (s % 4 === 2 || (g >= 2 && s % 2 === 0)) hat(c, dest, t, 0.05);
      if (last && s >= 12) snare(c, dest, t, 0.1);                                // 곡 끝 마디의 마지막 박: 스네어 롤로 다음 곡을 부른다
    } else {
      if (s === 0 || s === 8) kick(c, dest, t, 0.34);
      if (g >= 2 && (s === 4 || s === 12)) snare(c, dest, t, 0.09);
      if (s % 4 === 2) hat(c, dest, t, 0.035);
      if (last && s >= 12 && s % 2 === 0) snare(c, dest, t, 0.07);
    }
  }

  // ───── 재생(끊김 없이 곡을 이어 붙인다) ─────
  const OKEY = 'music';
  let musicOn = G.store.get(OKEY, true), want = null, S = null, idx = 0;
  const holds = new Set();
  function ctxReady() { const c = G.audioCtx(); return c && c.state === 'running' ? c : null; }
  function halt(fade, next) {                         // next=true: 게임이 끝나서 멈춤 → 다음 게임은 다음 곡부터 / 아니면 같은 곡 처음부터
    if (!S) return; const s = S; S = null; clearInterval(s.timer);
    try { s.master.gain.cancelScheduledValues(s.c.currentTime); s.master.gain.setValueAtTime(s.master.gain.value, s.c.currentTime); s.master.gain.linearRampToValueAtTime(0.0001, s.c.currentTime + (fade || 0.2)); } catch (e) {}
    setTimeout(() => { try { s.master.disconnect(); s.comp.disconnect(); } catch (e) {} }, ((fade || 0.2) + 0.4) * 1000);
    idx = next ? (s.track + 1) % 4 : s.track;
  }
  function launch() {
    if (S || !want || !musicOn || !G.soundOn || holds.size || document.hidden) return;
    const c = ctxReady(); if (!c) return;                                        // 손가락이 닿기 전엔 브라우저가 소리를 막는다 → 첫 터치 뒤에 시작
    const comp = c.createDynamicsCompressor(), master = c.createGain(); master.gain.setValueAtTime(0.0001, c.currentTime); master.gain.linearRampToValueAtTime(0.55, c.currentTime + 0.25);
    master.connect(comp); comp.connect(c.destination);
    S = { c, comp, master, track: idx, bar: 0, step: 0, next: c.currentTime + 0.08, hard: want.hard, rate: want.rate || 1, timer: 0 };
    const tick = () => {
      if (!S || S.c !== c) return;
      while (S.next < c.currentTime + 0.25) {
        const tr = FLAT[S.hard ? 'hard' : 'easy'][S.track];
        playStep(c, master, tr, S.bar, S.step, S.next, S.rate);
        S.next += 60 / (tr.bpm * S.rate) / 4;
        if (++S.step === 16) { S.step = 0; if (++S.bar === 16) { S.bar = 0; S.track = (S.track + 1) % 4; } }
      }
    };
    tick(); S.timer = setInterval(tick, 40);
  }
  const unlock = () => { if (want) { G.audioCtx(); launch(); } };
  document.addEventListener('pointerdown', unlock, { passive: true }); document.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { const w = want; halt(0.1); want = w; } else launch(); });

  G.music = {
    TRACKS, FLAT,
    play(hard, rate) { halt(0.2, false); want = { hard: !!hard, rate: rate || 1 }; launch(); },
    stop() { want = null; halt(0.3, true); },
    onSound() { if (!G.soundOn) { const w = want; halt(0.15); want = w; } else launch(); },
    setOn(b) { musicOn = !!b; G.store.set(OKEY, musicOn); if (!musicOn) { const w = want; halt(0.2); want = w; } else launch(); },
    isOn: () => musicOn,
    status: () => (S ? { playing: true, rate: S.rate, hard: S.hard, track: S.track, name: FLAT[S.hard ? 'hard' : 'easy'][S.track].name, bar: S.bar } : { playing: false, want: !!want }),
    // 시험용: 곡 하나를 소리 없이 파일처럼 만들어 본다
    render(hard, track, sr) {
      sr = sr || 22050; const tr = FLAT[hard ? 'hard' : 'easy'][track], secs = (16 * 16 * 60) / tr.bpm / 4 + 1.5;
      const c = new OfflineAudioContext(1, Math.floor(sr * secs), sr), comp = c.createDynamicsCompressor(), master = c.createGain(); master.gain.value = 0.55; master.connect(comp); comp.connect(c.destination);
      let t = 0.05; for (let bar = 0; bar < 16; bar++) for (let s = 0; s < 16; s++) { playStep(c, master, tr, bar, s, t); t += 60 / tr.bpm / 4; }
      return c.startRendering();
    },
  };
})();
