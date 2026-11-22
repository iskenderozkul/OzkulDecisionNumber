// Reproducible synthetic simulation for Section 9.1 of the revised manuscript.
// Place this file at tests/simulation.js in the repository and run:
//   node tests/simulation.js
// The fixed-seed uniform generator is a stress-test design, not an empirical model.
const HN = require('../src/core.js');

let rnd = 20261122;
const R = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
const P = (id, kind) => ({
  id, name: id, type: 'one', dir: 'up', S: 0, L: 1, B: 2,
  kind, mandatory: kind !== 'info', scale: 'lin', imp: 'medium'
});
const spec = params => ({
  params, betaLevel: 'balanced', beta: null,
  tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E',
  k: 0, coverage: 'k', alpha: null
});

const T = 20000;
const st = {
  cases: T, viol: 0,
  mean_false_pass: 0, geo_false_pass: 0, ours_false_pass: 0,
  mean_false_fail: 0, geo_false_fail: 0, ours_false_fail: 0,
  pad_mean_up: 0, pad_geo_up: 0, pad_ours_up: 0,
  pad_mean_flip: 0, pad_geo_flip: 0, pad_ours_flip: 0,
  soft_bad_compliant: 0, soft_bad_accepted: 0,
  soft_bad_referred: 0, soft_bad_rejected: 0
};

for (let t = 0; t < T; t++) {
  const nM = 2 + Math.floor(R() * 8);
  const nS = Math.floor(R() * 3);
  const ps = [], values = [];
  for (let i = 0; i < nM + nS; i++) {
    ps.push(P('p' + i, i < nM ? 'mand' : 'soft'));
    values.push(0.85 + R() * 1.3);
  }
  const s = spec(ps), inputs = {};
  ps.forEach((p, i) => { inputs[p.id] = { value: values[i], u: 0 }; });
  const result = HN.evaluate(s, inputs);
  const mandatoryScores = result.rows.filter(x => x.p.kind === 'mand').map(x => x.d);
  const allScores = result.rows.map(x => x.d);
  const compliant = mandatoryScores.every(d => d >= 0);
  if (!compliant) st.viol++;

  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const desirabilities = allScores.map(d => (d + 1) / 2);
  const geo = Math.pow(desirabilities.reduce((a, b) => a * b, 1), 1 / desirabilities.length);
  // Limit-point comparisons: mean >= 0; geometric desirability >= 0.5; Eq. (5) A >= 0.
  if (!compliant && mean >= 0) st.mean_false_pass++;
  if (!compliant && geo >= 0.5) st.geo_false_pass++;
  if (!compliant && result.A >= 0) st.ours_false_pass++;
  if (compliant && mean < 0) st.mean_false_fail++;
  if (compliant && geo < 0.5) st.geo_false_fail++;
  if (compliant && result.A < 0) st.ours_false_fail++;

  const softBad = result.rows.some(x => x.p.kind === 'soft' && x.d < 0);
  if (compliant && softBad) {
    st.soft_bad_compliant++;
    if (result.verdict === 'ACCEPT') st.soft_bad_accepted++;
    else if (result.verdict === 'DISCRETION') st.soft_bad_referred++;
    else if (result.verdict === 'REJECT') st.soft_bad_rejected++;
  }

  // Add three easy mandatory requirements at full score and recalculate.
  const paddedParams = ps.concat([P('e1', 'mand'), P('e2', 'mand'), P('e3', 'mand')]);
  const paddedInputs = Object.assign({}, inputs);
  ['e1', 'e2', 'e3'].forEach(k => { paddedInputs[k] = { value: 2, u: 0 }; });
  const paddedResult = HN.evaluate(spec(paddedParams), paddedInputs);
  const mean2 = (allScores.reduce((a, b) => a + b, 0) + 3) / (allScores.length + 3);
  const geo2 = Math.pow(desirabilities.concat([1, 1, 1]).reduce((a, b) => a * b, 1), 1 / (desirabilities.length + 3));
  if (mean2 > mean + 1e-9) st.pad_mean_up++;
  if (geo2 > geo + 1e-9) st.pad_geo_up++;
  if (paddedResult.A > result.A + 1e-9) st.pad_ours_up++;
  if (!compliant && mean < 0 && mean2 >= 0) st.pad_mean_flip++;
  if (!compliant && geo < 0.5 && geo2 >= 0.5) st.pad_geo_flip++;
  if (!compliant && result.A < 0 && paddedResult.A >= 0) st.pad_ours_flip++;
}

console.log(JSON.stringify(st, null, 2));
console.log('\nSummary');
console.log(`Violating mandatory specifications: ${st.viol} / ${T} (${(100 * st.viol / T).toFixed(1)} %)`);
console.log(`False passes (mean / geometric / Eq. 5): ${st.mean_false_pass} / ${st.geo_false_pass} / ${st.ours_false_pass}`);
console.log(`False fails (mean / geometric / Eq. 5): ${st.mean_false_fail} / ${st.geo_false_fail} / ${st.ours_false_fail}`);
console.log(`Padding raises value (mean / geometric / Eq. 5): ${st.pad_mean_up} / ${st.pad_geo_up} / ${st.pad_ours_up}`);
console.log(`Padding flips violation to pass (mean / geometric / Eq. 5): ${st.pad_mean_flip} / ${st.pad_geo_flip} / ${st.pad_ours_flip}`);
console.log(`Compliant cases with a negative penalising score: ${st.soft_bad_compliant}; accepted / referred / rejected: ${st.soft_bad_accepted} / ${st.soft_bad_referred} / ${st.soft_bad_rejected}`);
