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
// T9 decomposition: displayed parts add up to A (before clipping and rounding) in EVERY branch.
// Values are drawn from [-0.6, 2.2] with anchors S=0, L=1, B=2, so scores range over [-1, +1]:
// branches 5a, floor (5a with A<0 cut to 0), 5b first term, 5b second term and veto all occur and are counted.
{ let rnd = 7; const Rn = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  let bad = 0; const seen = {};
  for (let q = 0; q < 40000; q++) { const ps = [], vs = []; const n = 1 + Math.floor(Rn() * 5), k = Math.floor(Rn() * 3), g = Rn() < 0.3;
    for (let i = 0; i < n + k; i++) { const p = P('p' + i, i < n ? 'mand' : 'soft', 0, 1, 2); if (g && i < 2) p.link = 'G'; ps.push(p); vs.push(-0.6 + Rn() * 2.8); }
    const s = spec(ps, { betaLevel: ['none','slight','balanced','strong'][Math.floor(Rn() * 4)] }); const r = ev(s, vs);
    const key = r.branch + (g ? '+group' : ''); seen[key] = (seen[key] || 0) + 1;
    if (r.branch === 'veto') { if (r.A !== -1) bad++; continue; }
    const sum = r.parts.reduce((a, x) => a + x.v, 0); if (Math.abs(Math.max(-1, Math.min(1, sum)) - r.A) > 0.0101) bad++;
    if ((r.m < 0) !== (r.A < 0)) bad++; }
  ok(bad === 0, 'T9 decomposition and sign in all branches (mismatches: ' + bad + ')');
  ['5a', 'floor', '5b1', '5b2', 'veto', '5a+group', '5b1+group', '5b2+group'].forEach(b => ok((seen[b] || 0) > 100, 'T9 branch exercised: ' + b + ' (' + (seen[b] || 0) + ' cases)')); }
// T9b hand-checked cases for each branch (beta = 0.5, equal weights, anchors S=0, L=1, B=2)
{ const s2 = (k2) => spec([P('a','mand',0,1,2), P('b', k2, 0,1,2)]);
  let r = ev(s2('mand'), [0.2, 1.4]);   // m=-0.8, Delta=-0.2 -> 5b: a1=-0.5, a2=-0.8 -> A=-0.8, second term
  ok(r.branch === '5b2' && r.A === -0.8, 'T9b m<0, Delta<0: second term (A=' + r.A + ')');
  r = ev(s2('soft'), [0.9, 2.0]);       // m=-0.1, Delta=0.45 -> a1=0.175, a2=-0.1*(1-0.225)=-0.0775 -> A=-0.08
  ok(r.branch === '5b2' && r.A === -0.08, 'T9b m<0, Delta>0: second term (A=' + r.A + ')');
  r = ev(s2('soft'), [0.9, 0.2]);       // m=-0.1, Delta=-0.45 -> a1=-0.275, a2=-0.1 -> A=-0.28, first term
  ok(r.branch === '5b1' && r.A === -0.28, 'T9b m<0, Delta<0: first term (A=' + r.A + ')');
  r = ev(s2('soft'), [1.05, 0.1]);      // m=0.05, Delta=-0.425 -> 0.025-0.2125<0 -> floor 0
  ok(r.branch === 'floor' && r.A === 0 && r.reason === 'floored', 'T9b m>=0 with bad penalising: floor at 0');
  r = ev(s2('mand'), [0, 2]);           // a at -1 -> veto
  ok(r.branch === 'veto' && r.A === -1, 'T9b veto');
  const at0 = ev(s2('mand'), [1.0, 2.0]), below = ev(s2('mand'), [0.99, 2.0]);
  ok(at0.A >= 0 && below.A < 0, 'T9b both sides of m = 0 (A at 0: ' + at0.A + ', just below: ' + below.A + ')'); }
// T9c linked group with a negative member: counted once in Delta (min score, max weight), member still decides the sign
{ const ps = [P('a','mand',0,1,2), P('b','mand',0,1,2), P('c','soft',0,1,2)]; ps[0].link = 'G'; ps[1].link = 'G';
  const r = ev(spec(ps), [0.8, 2.0, 2.0]);   // group score = min(-0.2, 1) = -0.2; units: G(-0.2), c(1) -> Delta = 0.4; m = -0.2
  ok(r.units.length === 2 && Math.abs(r.M - 0.4) < 1e-9 && r.m === -0.2 && r.A < 0, 'T9c negative linked group (Delta=' + r.M + ', A=' + r.A + ')'); }
// T10 a specification without mandatory requirements cannot be locked
{ const e = HN.validateSpec(spec([P('x','soft',0,1,2)])); ok(e.some(m => /mandatory/.test(m)), 'T10 at least one mandatory requirement'); }

console.log(out.join('\n')); console.log('passed ' + pass + ', failed ' + fail);
if (typeof process !== 'undefined' && fail) process.exitCode = 1;
