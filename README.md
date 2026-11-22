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
Open `index.html` in any current browser (works offline, sends no data to any server).

1. **Write the specification** (owner) – for each requirement: direction, limit, full-score value, unacceptable value, and whether the limit value itself is **included** or **excluded**. Choose who decides (automatic accept / reject zones or always the owner) and lock it. The **lock code** (SHA-256) identifies this exact version.
2. **Send it to the contractor** – copy the link or send it by e-mail. The link carries the locked specification; the contractor cannot change the rules.
3. **Enter results** (contractor) – values, ± measurement uncertainty, calculation notes and evidence files (each file is fingerprinted). The decision number, a scale chart and a *closeness to acceptance* panel update live. Download the report and send it back.
4. **Review and decide** (owner) – load the report: the tool re-checks both fingerprints, every score and every evidence file, shows the evidence, and records **Accept / Conditional acceptance / Reject** with a justification and a decision code.

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
