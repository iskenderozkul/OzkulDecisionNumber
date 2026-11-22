// Özkul Decision Number — reproducible tests for src/core.js
// Run: node tests/core.test.js   (no dependencies)
const HN = (typeof require !== 'undefined') ? require('../src/core.js') : globalThis.HN;
let pass = 0, fail = 0; const out = [];
const ok = (cond, name) => { if (cond) pass++; else { fail++; out.push('FAIL: ' + name); } };
const P = (id, kind, S, L, B, extra) => Object.assign({ id, name: id, type: 'one', dir: B > L ? 'up' : 'down', S, L, B, kind, mandatory: kind !== 'info', scale: 'lin' }, extra || {});
const spec = (params, o) => Object.assign({ params, betaLevel: 'balanced', beta: null, tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E', k: 0, coverage: 'k', alpha: null }, o || {});
const ev = (s, vals) => { const inp = {}; s.params.forEach((p, i) => inp[p.id] = { value: vals[i], u: 0 }); return HN.evaluate(s, inp); };

// T1 sign rule: if every mandatory limit is met, A >= 0 (penalising cannot make it negative)
{ const s = spec([P('d1','mand',15,10,5), P('d2','mand',15,10,5), P('d3','mand',15,10,5), P('c','soft',150,100,70)]);
  const r = ev(s, [9.75, 9.75, 9.75, 140]);
  ok(r.m >= 0 && r.A === 0, 'T1 combined case floored at 0 (A=' + r.A + ')'); ok(r.verdict === 'DISCRETION', 'T1 verdict needs evaluation'); }
// T2 any violated mandatory limit gives A < 0
{ const s = spec([P('a','mand',15,10,5), P('b','mand',0,1,2)]); const r = ev(s, [10.5, 2]); ok(r.A < 0, 'T2 violation negative'); }
// T3 veto at the unacceptable value
{ const s = spec([P('a','mand',15,10,5), P('b','mand',0,1,2)]); const r = ev(s, [15, 2]); ok(r.A === -1 && r.veto, 'T3 veto'); }
// T4 discontinuity at m = 0 is real and equals beta*Delta (documented, not a bug)
{ const s = spec([P('a','mand',2,1,0), P('b','mand',0,1,2)]);
  const r0 = ev(s, [1.0, 1.8]), rm = ev(s, [1.01, 1.8]);
  ok(r0.A > 0 && rm.A < 0, 'T4 sign jumps across m = 0 (A0=' + r0.A + ', A-=' + rm.A + ')'); }
// T5 rounding never lifts a value over a threshold
{ ok(HN.floor2(0.19999999995) === 0.19, 'T5a floor below threshold'); ok(HN.floor2(0.2) === 0.2, 'T5b exact value kept'); ok(HN.floor2(0.07 + 0.13) === 0.2, 'T5c binary noise'); ok(HN.floor2(-0.001) === -0.01, 'T5d towards -1'); }
// T6 monotonicity and sign safety on random specifications
{ let rnd = 12345; const R = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  let bad = 0, monoBad = 0, cases = 0;
  for (let t = 0; t < 40000; t++) {
    const nM = 1 + Math.floor(R() * 5), nS = Math.floor(R() * 3), ps = [], vs = [];
    for (let i = 0; i < nM + nS; i++) { ps.push(P('p' + i, i < nM ? 'mand' : 'soft', 0, 1, 2, { imp: ['decisive','high','medium','low','minor'][Math.floor(R() * 5)] })); vs.push(-0.2 + R() * 2.6); }
    const s = spec(ps, { betaLevel: ['none','slight','balanced','strong'][Math.floor(R() * 4)] });
    const r = ev(s, vs); cases++;
    const mNeg = r.m < 0;
    if (mNeg && !(r.A < 0)) bad++; if (!mNeg && r.A < 0) bad++;
    const j = Math.floor(R() * vs.length), v2 = vs.slice(); v2[j] += 0.1; const r2 = ev(s, v2);
    if (r2.A < r.A - 1e-9) monoBad++;
  }
  ok(bad === 0, 'T6 sign safety on ' + cases + ' random specifications (violations: ' + bad + ')');
  ok(monoBad === 0, 'T6 monotonicity on ' + cases + ' random specifications (violations: ' + monoBad + ')'); }
// T7 kN family-wise coverage (Table 5)
{ const want = { 1: 1.64, 5: 2.32, 10: 2.57, 20: 2.80, 50: 3.08, 100: 3.28 };
  Object.keys(want).forEach(N => ok(Math.abs(HN.kN(+N, 0.05) - want[N]) < 0.01, 'T7 kN(' + N + ')')); }
// T8 fingerprint is a full 64-hex SHA-256 and canonical (key order does not matter)
{ const a = HN.sha256(HN.canon({ b: 1, a: [1, 2] })), b = HN.sha256(HN.canon({ a: [1, 2], b: 1 }));
  ok(/^[0-9a-f]{64}$/.test(a) && a === b, 'T8 canonical SHA-256'); }
// T9 decomposition: displayed parts add up to A (before clipping and rounding) on random specifications
{ let rnd = 7; const Rn = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648; let bad = 0;
  for (let q = 0; q < 20000; q++) { const ps = [], vs = []; const n = 1 + Math.floor(Rn() * 5), k = Math.floor(Rn() * 3);
    for (let i = 0; i < n + k; i++) { ps.push(P('p' + i, i < n ? 'mand' : 'soft', 0, 1, 2)); vs.push(0.2 + Rn() * 2); }
    const s = spec(ps, { betaLevel: ['none','slight','balanced','strong'][Math.floor(Rn() * 4)] }); const r = ev(s, vs); if (r.veto) continue;
    const sum = r.parts.reduce((a, x) => a + x.v, 0); if (Math.abs(Math.max(-1, Math.min(1, sum)) - r.A) > 0.0101) bad++; }
  ok(bad === 0, 'T9 decomposition identity (mismatches: ' + bad + ')'); }
// T10 a specification without mandatory requirements cannot be locked
{ const e = HN.validateSpec(spec([P('x','soft',0,1,2)])); ok(e.some(m => /mandatory/.test(m)), 'T10 at least one mandatory requirement'); }

console.log(out.join('\n')); console.log('passed ' + pass + ', failed ' + fail);
if (typeof process !== 'undefined' && fail) process.exitCode = 1;
