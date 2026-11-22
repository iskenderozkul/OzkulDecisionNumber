// Simulation study for Section 9.1 of the paper.
// Run: node tests/simulation.js   (seed fixed below; requires src/core.js)
const HN = require('../src/core.js');
let rnd = 20261122; const R = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
const P = (id, kind) => ({ id, name: id, type: 'one', dir: 'up', S: 0, L: 1, B: 2, kind, mandatory: kind !== 'info', scale: 'lin', imp: 'medium' });
const spec = (params) => ({ params, betaLevel: 'balanced', beta: null, tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E', k: 0, coverage: 'k', alpha: null });
const T = 20000; const st = { cases: 0, mean_false_pass: 0, geo_false_pass: 0, cpk_like_false_pass: 0, ours_false_pass: 0, min_false_pass: 0,
  pad_mean_up: 0, pad_ours_up: 0, pad_ours_sign: 0, pad_mean_sign: 0, viol: 0, ours_info_rank: 0, min_ties: 0, comp: 0, ours_grey_soft: 0, softcases: 0, mean_neg_comp: 0 };
for (let t = 0; t < T; t++) {
  const nM = 2 + Math.floor(R() * 8), nS = Math.floor(R() * 3), ps = [], vs = [];
  for (let i = 0; i < nM + nS; i++) { ps.push(P('p' + i, i < nM ? 'mand' : 'soft')); vs.push(0.85 + R() * 1.3); }
  const s = spec(ps); const inp = {}; ps.forEach((p, i) => inp[p.id] = { value: vs[i], u: 0 });
  const r = HN.evaluate(s, inp); st.cases++;
  const dM = r.rows.filter(x => x.p.kind === 'mand').map(x => x.d), dAll = r.rows.map(x => x.d);
  const compliant = dM.every(d => d >= 0); if (!compliant) st.viol++;
  const mean = dAll.reduce((a, b) => a + b, 0) / dAll.length;
  const des = dAll.map(d => (d + 1) / 2), geo = Math.pow(des.reduce((a, b) => a * b, 1), 1 / des.length);
  const minAll = Math.min(...dAll);
  // decision "accept" if index meets its own threshold equivalent to tau_acc=0 (limit)
  if (!compliant && mean >= 0) st.mean_false_pass++;
  if (!compliant && geo >= 0.5) st.geo_false_pass++;
  if (!compliant && Math.min(...dM) >= 0) st.min_false_pass++;
  if (!compliant && r.H >= 0) st.ours_false_pass++;
  // padding: add 3 easy mandatory requirements at full score
  const ps2 = ps.concat([P('e1','mand'), P('e2','mand'), P('e3','mand')]); const inp2 = Object.assign({}, inp); ['e1','e2','e3'].forEach(k => inp2[k] = { value: 2, u: 0 });
  const r2 = HN.evaluate(spec(ps2), inp2);
  const mean2 = (dAll.reduce((a, b) => a + b, 0) + 3) / (dAll.length + 3);
  if (mean2 > mean + 1e-9) st.pad_mean_up++; if (r2.H > r.H + 1e-9) st.pad_ours_up++;
  if (!compliant && r2.H >= 0) st.pad_ours_sign++; if (!compliant && mean < 0 && mean2 >= 0) st.pad_mean_sign++;
  if (nS > 0) { st.softcases++; const softBad = r.rows.some(x => x.p.kind === 'soft' && x.d < 0); if (compliant && softBad && r.verdict !== 'ACCEPT') st.ours_grey_soft++; if (compliant && mean < 0) st.mean_neg_comp++; }
}
console.log(JSON.stringify(st));
const pct = k => (100 * st[k] / st.cases).toFixed(1);
console.log('violating specs', st.viol, 'of', st.cases, '(' + (100 * st.viol / st.cases).toFixed(1) + ' %)');
console.log('false pass  mean', st.mean_false_pass, 'geo', st.geo_false_pass, 'min', st.min_false_pass, 'ours', st.ours_false_pass);
console.log('padding raises  mean', st.pad_mean_up, 'ours', st.pad_ours_up, '| padding flips sign  mean', st.pad_mean_sign, 'ours', st.pad_ours_sign);
console.log('soft cases', st.softcases, 'compliant with negative mean', st.mean_neg_comp, 'ours sends compliant+bad-soft to non-accept', st.ours_grey_soft);
