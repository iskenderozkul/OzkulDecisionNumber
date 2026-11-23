// Reproducible synthetic simulation for Section 9.1 of the manuscript.
// Run: node tests/simulation.js   (no dependencies)
// Three fixed-seed generators are stress tests, not empirical models of engineering specifications:
//   U  shallow  : values uniform on [0.85, 2.15]  (shallow violations next to good margins; worst case for averages)
//   D  deep     : values uniform on [0.20, 2.00]  (violations of any depth)
//   N  typical  : values normal(mean 1.45, sd 0.30), most requirements met with moderate margins
const HN = require('../src/core.js');
const P = (id, kind) => ({ id, name: id, type: 'one', dir: 'up', S: 0, L: 1, B: 2, kind, mandatory: kind !== 'info', scale: 'lin', imp: 'medium' });
const spec = params => ({ params, betaLevel: 'balanced', beta: null, tauA: 0.2, letterA: 'I', tauR: 0, letterR: 'E', k: 0, alpha: null });

function run(name, seed, draw) {
  let rnd = seed; const R = () => (rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648;
  const T = 20000;
  const st = { scenario: name, cases: T, viol: 0, mean_false_pass: 0, geo_false_pass: 0, ours_false_pass: 0,
    mean_false_fail: 0, geo_false_fail: 0, ours_false_fail: 0, pad_mean_up: 0, pad_geo_up: 0, pad_ours_up: 0,
    pad_mean_flip: 0, pad_geo_flip: 0, pad_ours_flip: 0, soft_bad_compliant: 0, soft_bad_accepted: 0, soft_bad_referred: 0, soft_bad_rejected: 0 };
  for (let t = 0; t < T; t++) {
    const nM = 2 + Math.floor(R() * 8), nS = Math.floor(R() * 3), ps = [], values = [];
    for (let i = 0; i < nM + nS; i++) { ps.push(P('p' + i, i < nM ? 'mand' : 'soft')); values.push(draw(R)); }
    const s = spec(ps), inputs = {}; ps.forEach((p, i) => { inputs[p.id] = { value: values[i], u: 0 }; });
    const result = HN.evaluate(s, inputs);
    const mandatoryScores = result.rows.filter(x => x.p.kind === 'mand').map(x => x.d);
    const allScores = result.rows.map(x => x.d);
    const compliant = mandatoryScores.every(d => d >= 0); if (!compliant) st.viol++;
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const des = allScores.map(d => (d + 1) / 2);
    const geo = Math.pow(des.reduce((a, b) => a * b, 1), 1 / des.length);
    if (!compliant && mean >= 0) st.mean_false_pass++; if (!compliant && geo >= 0.5) st.geo_false_pass++; if (!compliant && result.A >= 0) st.ours_false_pass++;
    if (compliant && mean < 0) st.mean_false_fail++; if (compliant && geo < 0.5) st.geo_false_fail++; if (compliant && result.A < 0) st.ours_false_fail++;
    if (compliant && result.rows.some(x => x.p.kind === 'soft' && x.d < 0)) { st.soft_bad_compliant++;
      if (result.verdict === 'ACCEPT') st.soft_bad_accepted++; else if (result.verdict === 'DISCRETION') st.soft_bad_referred++; else if (result.verdict === 'REJECT') st.soft_bad_rejected++; }
    // Add three easy mandatory requirements at full score and recalculate.
    const pp = ps.concat([P('e1', 'mand'), P('e2', 'mand'), P('e3', 'mand')]), pi = Object.assign({}, inputs);
    ['e1', 'e2', 'e3'].forEach(k => { pi[k] = { value: 2, u: 0 }; });
    const pr = HN.evaluate(spec(pp), pi);
    const mean2 = (allScores.reduce((a, b) => a + b, 0) + 3) / (allScores.length + 3);
    const geo2 = Math.pow(des.concat([1, 1, 1]).reduce((a, b) => a * b, 1), 1 / (des.length + 3));
    if (mean2 > mean + 1e-9) st.pad_mean_up++; if (geo2 > geo + 1e-9) st.pad_geo_up++; if (pr.A > result.A + 1e-9) st.pad_ours_up++;
    if (!compliant && mean < 0 && mean2 >= 0) st.pad_mean_flip++; if (!compliant && geo < 0.5 && geo2 >= 0.5) st.pad_geo_flip++; if (!compliant && result.A < 0 && pr.A >= 0) st.pad_ours_flip++;
  }
  return st;
}
const normal = (R, mu, sd) => { const u = Math.max(R(), 1e-12), v = R(); return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const results = [
  run('U shallow', 20261122, R => 0.85 + R() * 1.3),
  run('D deep', 20261123, R => 0.20 + R() * 1.8),
  run('N typical', 20261124, R => Math.max(0.05, normal(R, 1.45, 0.30)))
];
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + ' %' : '–';
results.forEach(st => {
  console.log('\n=== ' + st.scenario + ' ===');
  console.log(JSON.stringify(st));
  console.log(`Violating: ${st.viol} / ${st.cases} (${pct(st.viol, st.cases)})`);
  console.log(`False passes mean / geo / Eq.5: ${st.mean_false_pass} (${pct(st.mean_false_pass, st.viol)}) / ${st.geo_false_pass} (${pct(st.geo_false_pass, st.viol)}) / ${st.ours_false_pass}`);
  console.log(`False fails mean / geo / Eq.5: ${st.mean_false_fail} / ${st.geo_false_fail} / ${st.ours_false_fail}`);
  console.log(`Padding raises value: ${st.pad_mean_up} / ${st.pad_geo_up} / ${st.pad_ours_up}`);
  console.log(`Padding flips violation to pass: ${st.pad_mean_flip} / ${st.pad_geo_flip} / ${st.pad_ours_flip}`);
  console.log(`Compliant with negative penalising score: ${st.soft_bad_compliant}; accepted / referred / rejected: ${st.soft_bad_accepted} / ${st.soft_bad_referred} / ${st.soft_bad_rejected}`);
});
