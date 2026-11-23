# Changelog

## 1.0.0 (2026-11-23)
First public release, accompanying the manuscript "The Özkul Decision Number: a signed, decomposable summary of multi-requirement specification compliance".
- Scoring with three anchors, worst-side value, two-sided and logarithmic requirements, inclusive/exclusive limits.
- Decision number Eq. (5) with mandatory, penalising and information-only requirements, linked groups and zero floor; veto on the unrounded score.
- Bonferroni family-wise coverage factor k = Φ⁻¹(1 − α/N_eff), rounded upwards; N_eff counts two tail events per two-sided requirement.
- Decision rule with acceptance/rejection thresholds and boundary letters; partial results are withheld while inputs are incomplete.
- SHA-256 fingerprint over the canonical JSON specification; lock-and-submit workflow in the browser.
- Tests: 34 assertions in 14 blocks; fixed-seed simulation with three generators (Table 8).
