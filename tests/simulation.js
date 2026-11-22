// Simulation study for Section 9.1 of the paper.
// Run: node tests/simulation.js   (fixed seed; requires src/core.js)
//
// Design. 20 000 random specifications with 2-9 mandatory and 0-2 penalising requirements, anchors S=0, L=1, B=2,
// values uniform on [0.85, 2.15]. Ground truth: a specification is COMPLIANT iff every mandatory score is >= 0
// (computed directly from the scores, independently of every summary below).
// Each summary is applied with the same rule "pass if the summary is at or above its limit point":
//   arithmetic mean of all scores >= 0; geometric mean of desirabilities (d+1)/2 >= 0.5;
//   Eq. (5) A >= 0.
// The minimum of the mandatory scores is NOT reported as a competitor: it is the ground truth itself, so its
// false-pass count is zero by definition, not by evidence.
// Padding: three easy mandatory requirements at full score are appended to every specification.
// Run with argument 'mixture' (node tests/simulation.js mixture) for the sensitivity check of Section 9.1:
// each margin d = x - L is drawn from a mixture, 70 % comfortable (approx. normal, mean +0.4, sd 0.3) and
// 30 % near the limit (approx. normal, mean 0, sd 0.1).
const HN = (typeof require !== 'undefined') ? require('../src/core.js') : globalThis.HN;
let rnd = 20261122; const R = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
const P = (id, kind) => ({ id, name: id, type: 'one', dir: 'up', S: 0, L: 1, B: 2, kind, mandatory: kind !== 'info', scale: 'lin', imp: 'medium' });
const spec = (params) => ({ params, betaLevel: 'balanced', beta: null, tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E', k: 0, coverage: 'k', alpha: null });
const geoOf = ds => Math.pow(ds.map(d => (d + 1) / 2).reduce((a, b) => a * b, 1), 1 / ds.length);
const meanOf = ds => ds.reduce((a, b) => a + b, 0) / ds.length;
const T = 20000;
const MIX = typeof process !== 'undefined' && process.argv && process.argv.includes('mixture');
const gauss = () => { let u = 0; for (let q = 0; q < 6; q++) u += R(); return (u - 3) / Math.sqrt(0.5); };
const draw = () => MIX ? 1 + (R() < 0.7 ? 0.4 + 0.3 * gauss() : 0.1 * gauss()) : 0.85 + R() * 1.3;
const st = { cases: 0, violating: 0,
  falsePass: { mean: 0, geo: 0, eq5: 0 }, falseFail: { mean: 0, geo: 0, eq5: 0 },
  paddingRaises: { mean: 0, geo: 0, eq5: 0 }, paddingTurnsViolationIntoPass: { mean: 0, geo: 0, eq5: 0 },
  compliantWithPenalisingOverLimit: 0, thoseAccepted: 0, thoseReferred: 0, thoseRejected: 0 };
for (let t = 0; t < T; t++) {
  const nM = 2 + Math.floor(R() * 8), nS = Math.floor(R() * 3), ps = [], inp = {};
  for (let i = 0; i < nM + nS; i++) { const p = P('p' + i, i < nM ? 'mand' : 'soft'); ps.push(p); inp[p.id] = { value: draw(), u: 0 }; }
  const r = HN.evaluate(spec(ps), inp); st.cases++;
  const dM = r.rows.filter(x => x.p.kind === 'mand').map(x => x.d), dAll = r.rows.map(x => x.d);
  const compliant = dM.every(d => d >= 0); if (!compliant) st.violating++;
  const pass = { mean: meanOf(dAll) >= 0, geo: geoOf(dAll) >= 0.5, eq5: r.A >= 0 };
  for (const k in pass) { if (!compliant && pass[k]) st.falsePass[k]++; if (compliant && !pass[k]) st.falseFail[k]++; }
  // padding
  const ps2 = ps.concat([P('e1', 'mand'), P('e2', 'mand'), P('e3', 'mand')]), inp2 = Object.assign({}, inp);
  ['e1', 'e2', 'e3'].forEach(k => inp2[k] = { value: 2, u: 0 });
  const r2 = HN.evaluate(spec(ps2), inp2); const dAll2 = dAll.concat([1, 1, 1]);
  const before = { mean: meanOf(dAll), geo: geoOf(dAll), eq5: r.A }, after = { mean: meanOf(dAll2), geo: geoOf(dAll2), eq5: r2.A };
  const pass2 = { mean: after.mean >= 0, geo: after.geo >= 0.5, eq5: r2.A >= 0 };
  for (const k in before) { if (after[k] > before[k] + 1e-9) st.paddingRaises[k]++; if (!compliant && !pass[k] && pass2[k]) st.paddingTurnsViolationIntoPass[k]++; }
  // penalising requirement over its limit in a compliant specification
  if (compliant && r.rows.some(x => x.p.kind === 'soft' && x.d < 0)) { st.compliantWithPenalisingOverLimit++;
    if (r.verdict === 'ACCEPT') st.thoseAccepted++; else if (r.verdict === 'REJECT') st.thoseRejected++; else st.thoseReferred++; }
}
console.log((MIX ? 'mixture' : 'uniform') + ' distribution');
console.log(JSON.stringify(st, null, 1));
