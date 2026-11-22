// ===== Özkul Decision Number — core (shared by UI and tests) =====
const HN = (function () {
  function ror(x, n) { return (x >>> n) | (x << (32 - n)); }
  const PR = []; for (let c = 2; PR.length < 64; c++) { if (PR.every(p => c % p)) PR.push(c); }
  const frac32 = v => Math.floor((v - Math.floor(v)) * 4294967296) >>> 0;
  const K = PR.map(p => frac32(Math.cbrt(p)));
  const H0 = PR.slice(0, 8).map(p => frac32(Math.sqrt(p)));
  function sha256(str) {
    const bytes = (typeof str === 'string') ? new TextEncoder().encode(str) : str;
    const l = bytes.length, total = Math.ceil((l + 9) / 64) * 64;
    const m = new Uint8Array(total); m.set(bytes); m[l] = 0x80;
    const dv = new DataView(m.buffer); const bits = l * 8;
    dv.setUint32(total - 4, bits >>> 0); dv.setUint32(total - 8, Math.floor(bits / 4294967296));
    let h = H0.slice(); const w = new Uint32Array(64);
    for (let i = 0; i < total; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = ror(w[t - 15], 7) ^ ror(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = ror(w[t - 2], 17) ^ ror(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t++) {
        const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25), ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22), mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x >>> 0);
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('');
  }
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  // statistics
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function invPhi(p) { let lo = -10, hi = 10; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (Phi(mid) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  const kN = (N, alpha) => Math.round(invPhi(Math.pow(1 - alpha, 1 / Math.max(1, N))) * 100) / 100;
  // scoring
  const floor2 = v => Math.floor(Math.round(v * 1e12) / 1e10) / 100; // round towards -1; the 1e-12 snap removes binary noise only
  const clip = v => Math.max(-1, Math.min(1, v));
  function side(x, S, L, B) { if (B === L) return x === L ? 1 : ((x - L) * Math.sign(B - S || 1) >= 0 ? 1 : (x - L) / (L - S)); const t = (x - L) / (B - L); return t >= 0 ? t : (x - L) / (L - S); }
  const num = v => (v === '' || v === null || v === undefined || isNaN(+v)) ? null : +v;
  function validateSpec(s) {
    const e = [];
    if (!s.params || !s.params.length) e.push('The specification has no parameters.');
    const ids = new Set();
    (s.params || []).forEach((p, i) => {
      const tag = 'Parameter ' + (i + 1) + ' (' + (p.name || 'unnamed') + '): ';
      if (!p.name) e.push(tag + 'name is required.');
      if (ids.has(p.id)) e.push(tag + 'duplicate identifier.'); ids.add(p.id);
      if (p.type === 'one') {
        const S = num(p.S), L = num(p.L), B = num(p.B);
        if (S === null || L === null || B === null) e.push(tag + 'S, L and B are required.');
        else if (p.dir !== 'up' && p.dir !== 'down') e.push(tag + 'declare whether higher or lower is better.');
        else if (p.dir === 'up' && !(S < L && L < B)) e.push(tag + 'declared \u201chigher is better\u201d, so the anchors must satisfy S < L < B. Check whether the direction or the anchors are wrong.');
        else if (p.dir === 'down' && !(S > L && L > B)) e.push(tag + 'declared \u201clower is better\u201d, so the anchors must satisfy S > L > B. Check whether the direction or the anchors are wrong.');
        if (p.scale === 'log' && [S, L, B].some(v => v !== null && v <= 0)) e.push(tag + 'logarithmic scale needs positive anchors.');
      } else if (p.type === 'two') {
        const a = ['Slo', 'Llo', 'Blo', 'Bhi', 'Lhi', 'Shi'].map(k => num(p[k]));
        if (a.some(v => v === null)) e.push(tag + 'all six two-sided anchors are required.');
        else if (!(a[0] < a[1] && a[1] <= a[2] && a[2] <= a[3] && a[3] <= a[4] && a[4] < a[5] && a[1] < a[4])) e.push(tag + 'two-sided anchors must satisfy S_lo < L_lo \u2264 B_lo \u2264 B_hi \u2264 L_hi < S_hi.');
        if (p.scale === 'log' && a.some(v => v !== null && v <= 0)) e.push(tag + 'logarithmic scale needs positive anchors.');
      }
      if (num(p.u0) !== null && num(p.u0) < 0) e.push(tag + 'default uncertainty cannot be negative.');
    });
    const tA = num(s.tauA), tR = num(s.tauR);
    if (tA !== null && (tA < 0 || tA > 1)) e.push('Acceptance threshold must lie between 0 and +1 (a violated limit can never be accepted automatically).');
    if (tR !== null && (tR < -1 || tR > 1)) e.push('Rejection threshold must lie between \u22121 and +1.');
    if (tA !== null && tR !== null && tR > tA) e.push('Rejection threshold must not exceed the acceptance threshold.');
    if (num(s.beta) !== null && (num(s.beta) < 0 || num(s.beta) > 0.75)) e.push('The effect of other requirements (beta) must lie between 0 and 0.75.');
    (s.params || []).forEach((p, i) => { const w = num(p.w); if (w !== null && w < 0) e.push('Parameter ' + (i + 1) + ': weight cannot be negative.'); });
    if (!(s.params || []).some(p => (p.kind || (p.mandatory === false ? 'info' : 'mand')) === 'mand')) e.push('At least one requirement must be mandatory.');
    if (s.alpha === null || s.alpha === undefined || s.alpha === '') { if (num(s.k) === null || num(s.k) < 0) e.push('Coverage factor k must be zero or positive.'); }
    else if (!(num(s.alpha) > 0 && num(s.alpha) < 0.5)) e.push('Family-wise risk \u03b1 must lie between 0 and 0.5.');
    return e;
  }
  function kUsed(s) {
    const N = s.params.filter(p => (p.kind || (p.mandatory === false ? 'info' : 'mand')) !== 'info').length;
    return (s.alpha !== null && s.alpha !== undefined && s.alpha !== '') ? kN(N, +s.alpha) : +s.k;
  }
  function scoreParam(p, inp, k) {
    inp = inp || {};
    if (p.type === 'bool') {
      if (inp.value === 'yes') return { status: 'ok', d: 1, xs: 'yes' };
      if (inp.value === 'no') return { status: 'ok', d: -1, xs: 'no' };
      return { status: 'missing' };
    }
    const x = num(inp.value); if (x === null) return { status: 'missing' };
    if ((num(p.vmin) !== null && x < +p.vmin) || (num(p.vmax) !== null && x > +p.vmax)) return { status: 'invalid', reason: 'outside the validity range' };
    let u = num(inp.u); if (u === null) u = num(p.u0) || 0;
    if (u < 0) return { status: 'invalid', reason: 'negative uncertainty' };
    const T = v => p.scale === 'log' ? Math.log10(v) : v;
    if (p.type === 'one') {
      const S = +p.S, L = +p.L, B = +p.B, dir = Math.sign(B - L), xs = x - k * u * dir;
      if (p.scale === 'log' && xs <= 0) return { status: 'invalid', reason: 'non-positive value on a log scale' };
      let d1 = floor2(clip(side(T(xs), T(S), T(L), T(B))));
      if (p.incl === 'E' && Math.abs(xs - L) < 1e-12) d1 = -0.01;
      return { status: 'ok', d: d1, xs: xs, u: u, atLimitExcluded: p.incl === 'E' && Math.abs(xs - L) < 1e-12 };
    }
    const xl = x - k * u, xh = x + k * u;
    if (p.scale === 'log' && xl <= 0) return { status: 'invalid', reason: 'non-positive value on a log scale' };
    let dl = clip(side(T(xl), T(+p.Slo), T(+p.Llo), T(+p.Blo)));
    let dh = clip(side(T(xh), T(+p.Shi), T(+p.Lhi), T(+p.Bhi)));
    if (p.inclLo === 'E' && Math.abs(xl - +p.Llo) < 1e-12) dl = -0.01;
    if (p.inclHi === 'E' && Math.abs(xh - +p.Lhi) < 1e-12) dh = -0.01;
    return { status: 'ok', d: floor2(Math.min(dl, dh)), xs: dl <= dh ? xl : xh, sideBinding: dl <= dh ? 'lower' : 'upper', u: u };
  }
  const IMP = { decisive: 1.00, high: 0.75, medium: 0.50, low: 0.25, minor: 0.10 };
  const BETA = { none: 0, slight: 0.25, balanced: 0.5, strong: 0.75 };
  const kindOf = p => p.kind || (p.mandatory === false ? 'info' : 'mand');
  const weightOf = p => { const w = num(p.w); if (w !== null && w >= 0) return w; return IMP[p.imp || 'medium']; };
  function betaOf(s) { const b = num(s.beta); if (b !== null) return Math.max(0, Math.min(0.75, b)); return BETA[s.betaLevel || 'balanced']; }
  // core aggregation on a list of {p,d,status,atLimitExcluded}
  function aggregate(s, rows) {
    const beta = betaOf(s);
    const used = rows.filter(r => kindOf(r.p) !== 'info');
    const mand = used.filter(r => kindOf(r.p) === 'mand');
    const okU = used.filter(r => r.status === 'ok'), okM = mand.filter(r => r.status === 'ok');
    const N = used.length, n = okU.length;
    if (!n) return { beta, N, n, A: null, m: null, M: null, parts: [], binding: [], veto: false, units: [] };
    // units: linked groups count once (score = min of members, weight = max of members)
    const units = []; const gmap = {};
    okU.forEach(r => { const g = (r.p.link || '').trim();
      if (g) { if (!gmap[g]) { gmap[g] = { key: 'g:' + g, label: g, members: [], d: Infinity, w: 0, mand: false }; units.push(gmap[g]); }
        const u = gmap[g]; u.members.push(r); if (r.d < u.d) u.d = r.d; u.w = Math.max(u.w, weightOf(r.p)); if (kindOf(r.p) === 'mand') u.mand = true; }
      else units.push({ key: r.p.id, label: r.p.name, members: [r], d: r.d, w: weightOf(r.p), mand: kindOf(r.p) === 'mand' }); });
    const W = units.reduce((a, u) => a + u.w, 0) || 1;
    units.forEach(u => u.wn = u.w / W);
    const M = units.reduce((a, u) => a + u.wn * u.d, 0);
    const m = okM.length ? Math.min.apply(null, okM.map(r => r.d)) : null;
    const veto = okM.some(r => r.d <= -1);
    const critical = false; // reserved, not used
    let A, parts = [], floored = false, branch = null;
    if (veto) { A = -1; branch = 'veto'; parts = [{ key: 'veto', label: 'veto', v: -1 }]; }
    else if (m === null) { A = M; branch = 'none'; parts = units.map(u => ({ key: u.key, label: u.label, v: u.wn * u.d, d: u.d, unit: u })); }
    else if (m < 0) { // violation: sign locked negative. A = min( (1-b)m + bM , m(1 - b*max(0,M)) )
      const a1 = (1 - beta) * m + beta * M, Mp = Math.max(0, M), a2 = m * (1 - beta * Mp);
      if (a1 <= a2) { A = a1; branch = '5b1'; parts = [{ key: 'base', label: 'base', v: (1 - beta) * m, d: m }].concat(units.map(u => ({ key: u.key, label: u.label, v: beta * u.wn * u.d, d: u.d, unit: u }))); }
      else { A = a2; branch = '5b2';
        parts = [{ key: 'base', label: 'base', v: m, d: m }].concat(units.map(u => ({ key: u.key, label: u.label, v: M > 0 ? -m * beta * u.wn * u.d : 0, d: u.d, unit: u }))); } }
    else { A = (1 - beta) * m + beta * M; branch = '5a';
      parts = [{ key: 'base', label: 'base', v: (1 - beta) * m, d: m }].concat(units.map(u => ({ key: u.key, label: u.label, v: beta * u.wn * u.d, d: u.d, unit: u })));
      if (A < 0) { // sign rule: penalising requirements may lower A to 0 but never make it negative while every mandatory limit is met
        const cut = -A; parts.push({ key: 'floor', label: 'floor', v: cut }); floored = true; branch = 'floor'; A = 0; } }
    A = Math.max(-1, Math.min(1, A)); A = floor2(A);
    const binding = m === null ? [] : okM.filter(r => r.d === m).map(r => r.p.name);
    return { beta, N, n, A, m, M, parts, binding, veto, critical, floored, branch, units };
  }
  function decide(s, ag) {
    const tA = num(s.tauA), tR = num(s.tauR);
    if (ag.N === 0) return 'EMPTY';
    if (ag.n < ag.N) return 'NOT_APPROVABLE';
    const A = ag.A, mOk = ag.m === null || (s.letterA === 'E' ? ag.m > tA : ag.m >= tA);
    if (tA !== null && (s.letterA === 'E' ? A > tA : A >= tA) && mOk) return 'ACCEPT';
    if (ag.critical) return 'REJECT';
    if (tR !== null && (s.letterR === 'E' ? A < tR : A <= tR)) return 'REJECT';
    return 'DISCRETION';
  }
  function evaluate(s, inputs) {
    const k = kUsed(s); const rows = []; const groups = {};
    s.params.forEach(p => { const r = scoreParam(p, inputs[p.id], k); r.p = p; rows.push(r); });
    const ag = aggregate(s, rows);
    rows.filter(r => r.status === 'ok' && kindOf(r.p) !== 'info').forEach(r => { const g = r.p.group || 'All parameters'; groups[g] = groups[g] === undefined ? r.d : Math.min(groups[g], r.d); });
    const verdict = decide(s, ag);
    const H = ag.A;
    const reason = H === null ? null : ag.veto ? 'veto' : (ag.m !== null && ag.m < 0) ? 'violation' : (ag.floored ? 'floored' : (rows.some(r => r.status === 'ok' && kindOf(r.p) === 'soft' && r.d < 0) ? 'softpenalty' : 'ok'));
    const nearLimit = rows.filter(r => r.status === 'ok' && kindOf(r.p) === 'mand' && r.d >= 0 && r.d < 0.10).length;
    return { k, rows, N: ag.N, n: ag.n, H, A: H, m: ag.m, M: ag.M, beta: ag.beta, parts: ag.parts, units: ag.units, binding: ag.binding, veto: ag.veto, critical: ag.critical, floored: ag.floored, branch: ag.branch, reason, groups, verdict, nearLimit, compliant: ag.m === null ? null : ag.m >= 0 };
  }
  // scenario simulation for soft requirements: other values at 'typical' (+0.40 / near limit +0.05)
  function simulate(s) {
    const soft = s.params.filter(p => kindOf(p) === 'soft');
    const levels = [['slight', -0.25], ['bad', -0.5], ['worst', -1]];
    const ctx = [['good', 0.40], ['tight', 0.05]];
    const out = [];
    soft.forEach(sp => { levels.forEach(([lv, dv]) => { ctx.forEach(([cx, base]) => {
      const rows = s.params.filter(p => kindOf(p) !== 'info').map(p => ({ p, status: 'ok', d: p.id === sp.id ? dv : base }));
      const ag = aggregate(s, rows); out.push({ id: sp.id, name: sp.name, level: lv, ctx: cx, d: dv, A: ag.A, verdict: decide(s, ag) }); }); }); });
    return out;
  }
  // sensitivity: perturb each weight by +-20%
  function sensitivity(s, inputs) {
    const base = evaluate(s, inputs); if (base.H === null) return { sensitive: false, cases: [] };
    const cases = [];
    s.params.forEach(p => { if (kindOf(p) === 'info') return; [0.8, 1.2].forEach(f => {
      const s2 = JSON.parse(JSON.stringify(s)); const q = s2.params.find(x => x.id === p.id); q.w = weightOf(p) * f;
      const r = evaluate(s2, inputs); if (r.verdict !== base.verdict) cases.push({ name: p.name, f, verdict: r.verdict, A: r.H }); }); });
    return { sensitive: cases.length > 0, cases };
  }
  const fmt = v => v === null || v === undefined ? '\u2013' : (v > 0 ? '+' : v < 0 ? '\u2212' : '') + Math.abs(v).toFixed(2);
  return { sha256, canon, kN, Phi, floor2, scoreParam, evaluate, simulate, sensitivity, aggregate, IMP, BETA, kindOf, weightOf, betaOf, validateSpec, kUsed, fmt, num };
})();
if (typeof module !== 'undefined') module.exports = HN;
if (typeof session !== 'undefined') session.HN = HN;
