// Özkul Decision Number — reproducible tests for src/core.js
// Run: node tests/core.test.js   (no dependencies)
const HN = (typeof require !== 'undefined') ? require('../src/core.js') : globalThis.HN;
let pass = 0, fail = 0; const out = [];
const ok = (cond, name) => { if (cond) pass++; else { fail++; out.push('FAIL: ' + name); } };
const P = (id, kind, S, L, B, extra) => Object.assign({ id, name: id, type: 'one', dir: B > L ? 'up' : 'down', S, L, B, kind, mandatory: kind !== 'info', scale: 'lin' }, extra || {});
const spec = (params, o) => Object.assign({ params, betaLevel: 'balanced', beta: null, tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E', k: 0, alpha: null }, o || {});
const ev = (s, vals) => { const inp = {}; s.params.forEach((p, i) => inp[p.id] = { value: vals[i], u: 0 }); return HN.evaluate(s, inp); };

// T1 sign rule: if every mandatory limit is met, A >= 0 (penalising cannot make it negative)
{ const s = spec([P('d1','mand',15,10,5), P('d2','mand',15,10,5), P('d3','mand',15,10,5), P('c','soft',150,100,70)]);
  const r = ev(s, [9.75, 9.75, 9.75, 140]);
  ok(r.m >= 0 && r.A === 0, 'T1 combined case floored at 0 (A=' + r.A + ')'); ok(r.verdict === 'DISCRETION', 'T1 verdict needs evaluation'); }
// T2 any violated mandatory limit gives A < 0
{ const s = spec([P('a','mand',15,10,5), P('b','mand',0,1,2)]); const r = ev(s, [10.5, 2]); ok(r.A < 0, 'T2 violation negative'); }
// T3 veto at the unacceptable value
{ const s = spec([P('a','mand',15,10,5), P('b','mand',0,1,2)]); const r = ev(s, [15, 2]); ok(r.A === -1 && r.veto, 'T3 veto'); }
// T4 the sign changes across m = 0 (the exact jump magnitude is checked in T13)
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
// T7 Bonferroni family-wise coverage factor, rounded upwards (Table 5)
{ const want = { 1: 1.65, 5: 2.33, 10: 2.58, 20: 2.81, 50: 3.10, 100: 3.30 };
  Object.keys(want).forEach(N => ok(HN.kN(+N, 0.05) === want[N], 'T7 kN(' + N + ') = ' + HN.kN(+N, 0.05)));
  ok(HN.kN(0, 0.05) === 0, 'T7 k_0 = 0'); }
// T8 SHA-256 test vectors (FIPS 180-4) and canonical key order
{ ok(HN.sha256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'T8a SHA-256 of empty string');
  ok(HN.sha256('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'T8b SHA-256 of "abc"');
  ok(HN.sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq') === '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1', 'T8c SHA-256 two-block vector');
  const a = HN.sha256(HN.canon({ b: 1, a: [1, 2] })), b = HN.sha256(HN.canon({ a: [1, 2], b: 1 }));
  ok(/^[0-9a-f]{64}$/.test(a) && a === b, 'T8d canonical form independent of key order'); }
// T9 decomposition identity on seeded cases with positive and negative binding scores, linked and unlinked groups
{ let rnd = 7; const Rn = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  let bad = 0, neg = 0, pos = 0, linked = 0, used = 0;
  for (let q = 0; q < 20000; q++) { const ps = [], vs = []; const n = 1 + Math.floor(Rn() * 5), k = Math.floor(Rn() * 3);
    for (let i = 0; i < n + k; i++) { const link = (i < n && n > 1 && Rn() < 0.4) ? 'G' : ''; ps.push(P('p' + i, i < n ? 'mand' : 'soft', 0, 1, 2, { link, imp: ['decisive','high','medium','low','minor'][Math.floor(Rn() * 5)] })); vs.push(0.05 + Rn() * 2.1); }
    const s = spec(ps, { betaLevel: ['none','slight','balanced','strong'][Math.floor(Rn() * 4)] }); const r = ev(s, vs); if (r.veto || r.A === null) continue;
    used++; if (r.m < 0) neg++; else pos++; if (ps.some(p => p.link)) linked++;
    const sum = r.parts.reduce((a, x) => a + x.v, 0); const expect = Math.floor(Math.round(Math.max(-1, Math.min(1, sum)) * 1e12) / 1e10) / 100;
    if (expect !== r.A) bad++; }
  ok(bad === 0, 'T9 decomposition identity, exact after rounding (mismatches: ' + bad + ' of ' + used + ')');
  ok(neg > 1000 && pos > 1000 && linked > 1000, 'T9 coverage: m<0 ' + neg + ', m>=0 ' + pos + ', linked ' + linked); }
// T10 a specification without mandatory requirements cannot be locked
{ const e = HN.validateSpec(spec([P('x','soft',0,1,2)])); ok(e.some(m => /mandatory/.test(m)), 'T10 at least one mandatory requirement'); }
// T11 incomplete inputs: no partial decision number is shown
{ const s = spec([P('a','mand',0,1,2), P('b','mand',0,1,2)]); const r = HN.evaluate(s, { a: { value: 1.5, u: 0 } });
  ok(r.A === null && r.verdict === 'NOT_APPROVABLE' && r.n === 1 && r.N === 2, 'T11 partial result withheld (A=' + r.A + ')'); }
// T12 all-zero weights and unsupported types are rejected
{ const e1 = HN.validateSpec(spec([P('a','mand',0,1,2,{ w: 0 }), P('b','soft',0,1,2,{ w: 0 })]));
  ok(e1.some(m => /total weight/.test(m)), 'T12a all-zero weights rejected');
  const e2 = HN.validateSpec(spec([Object.assign(P('a','mand',0,1,2), { type: 'weird' })]));
  ok(e2.some(m => /unsupported requirement type/.test(m)), 'T12b unsupported type rejected');
  const e3 = HN.validateSpec(spec([P('a','mandatoryish',0,1,2)]));
  ok(e3.some(m => /unsupported requirement kind/.test(m)), 'T12c unsupported kind rejected'); }
// T13 exact jump at m = 0 for positive and negative Delta, computed on the unrounded aggregation
{ const jump = (dm, others, beta) => { const rows0 = [{ p: P('a','mand',0,1,2), status: 'ok', d: dm }].concat(others.map((d, i) => ({ p: P('o' + i,'soft',0,1,2), status: 'ok', d })));
    return HN.aggregate(spec([], { beta }), rows0); };
  const others = [0.8, 0.6], beta = 0.5, D0 = (0 + 0.8 + 0.6) / 3;
  const at0 = jump(0, others, beta).A, below = jump(-1e-9, others, beta).A;
  ok(at0 === Math.floor(beta * D0 * 100) / 100 && below === -0.01, 'T13a positive Delta: value at 0 = beta*Delta0 (' + at0 + '), left limit -> 0 (' + below + ')');
  const othersN = [-0.8, -0.6], D0n = (0 - 0.8 - 0.6) / 3;
  const at0n = jump(0, othersN, beta).A, belown = jump(-1e-9, othersN, beta).A;
  ok(at0n === 0 && Math.abs(belown - Math.floor(beta * D0n * 100) / 100) < 1e-9, 'T13b negative Delta: value at 0 = 0, left limit = beta*Delta0 (' + belown + ')'); }
// T14 effective tail count and veto on the unrounded score
{ const two = { id: 't', name: 't', type: 'two', kind: 'mand', Slo: 0, Llo: 1, Blo: 2, Bhi: 2, Lhi: 3, Shi: 4 };
  const s = spec([P('a','mand',0,1,2), two, { id: 'y', name: 'y', type: 'bool', kind: 'mand' }, P('i','info',0,1,2)], { alpha: 0.05 });
  ok(HN.nEff(s) === 3 && HN.kUsed(s) === HN.kN(3, 0.05), 'T14a N_eff counts one-sided 1, two-sided 2, yes/no and info 0 (N_eff=' + HN.nEff(s) + ')');
  const s2 = spec([P('a','mand',0,1,2), P('b','mand',0,1,2)]);
  const r = ev(s2, [0.005, 2]); ok(!r.veto && r.reason === 'violation', 'T14b a score of -0.995 is displayed as -1.00 but is reported as a limit violation, not a veto (A=' + r.A + ')');
  const r2 = ev(s2, [0, 2]); ok(r2.veto && r2.A === -1 && r2.reason === 'veto', 'T14c a value at the unacceptable anchor is a veto'); }

console.log(out.join('\n')); console.log('passed ' + pass + ', failed ' + fail);
if (typeof process !== 'undefined' && fail) process.exitCode = 1;
