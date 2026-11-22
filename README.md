# Özkul Decision Number

Reference implementation of the **Özkul Decision Number (A)**, a signed, saturating and inflation-proof way of
communicating whether a piece of work meets a multi-parameter specification.

**Try it online:** https://iskenderozkul.github.io/OzkulDecisionNumber/

**Paper:** İ. Özkul, *The Özkul Decision Number: a signed, saturating and inflation-proof notation for
communicating multi-parameter specification compliance* (manuscript, 2026).

## What it does
- Every requirement of a specification is mapped to a score on one fixed ruler: **+1** saturated acceptance,
  **0** exactly at the limit, **−1** unacceptable.
- The decision number is the **smallest** score: a surplus on one requirement can never hide a shortfall on another,
  and adding easy requirements can never raise the result.
- The owner **locks** the specification (SHA-256 fingerprint); the submitter only enters values; a reviewer
  re-computes everything from the report.

## Use
Open `index.html` in any current browser (works offline, sends no data).
1. **Write the specification** (owner) – direction, limit, full-score value, unacceptable value, whether the limit value itself is **included** or **excluded**, and the decision rule. Lock it.
2. **Enter results** (submitter) – values and uncertainties; the decision appears live. Download the report.
3. **Verify a report** (reviewer) – load the report; every line must say PASS.

All worked examples of the paper are available from the example menu.

## Files
| File | Purpose |
|---|---|
| `index.html` | Complete tool, single file |
| `src/core.js` | Scoring, decision rule and SHA-256 engine (also embedded in `index.html`) |
| `src/page_template.html` | Page template from which `index.html` is assembled |

## Publish as a web page
Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.

## Cite
Özkul, İ. (2026). *Özkul Decision Number – reference implementation* [Software].
https://github.com/iskenderozkul/OzkulDecisionNumber

## Limits
The fingerprint makes changes detectable; it does not prove authorship. For contractual use, sign it digitally.

## License
Apache-2.0
