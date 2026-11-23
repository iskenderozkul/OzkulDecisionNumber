# Changelog

## 1.8.1 (2026-11-22)
- Family-wise coverage factor changed to the Bonferroni form k = Φ⁻¹(1 − α/N_eff), rounded upwards (was Šidák, rounded to nearest), matching Eq. (7) and Table 5.
- N_eff now counts two tail events for a two-sided requirement and none for yes/no and information-only requirements.
- Veto is triggered only when a mandatory score actually reaches the unacceptable anchor before display rounding.
- No decision number is produced while decision-relevant inputs are missing, or when the total decision weight is zero.
- Validation rejects unsupported requirement types and kinds and an all-zero weight set.
- Removed unused `critical` flag and the dead rejection branch.
- Tests extended to 34 assertions in 14 blocks: SHA-256 test vectors, exact jump at m = 0, decomposition with linked groups and negative binding scores, N_eff, partial-result withholding.
- Simulation extended to three generators (shallow U, deep D, typical N); Table 8 reports all three.
- README, CITATION.cff (schema 1.2.0) and version labels aligned with the manuscript.

## 1.7.0
- Previous release.
