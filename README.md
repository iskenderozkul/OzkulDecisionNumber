# Özkul Decision Number

Reference implementation (version 1.0) of the **Özkul Decision Number (A)**, a signed, saturating summary of
whether a piece of work meets a multi-requirement specification. Its sign cannot be inflated while a mandatory limit is violated.

**Try it online:** https://iskenderozkul.github.io/OzkulDecisionNumber/

**Paper:** İ. Özkul, *The Özkul Decision Number: a signed, decomposable summary of multi-requirement specification
compliance* (manuscript, 2026).

## What it does
- Every decision-relevant requirement (mandatory or penalising) is mapped to a score on one fixed ruler: **+1** full score, **0** the compliance boundary, and **−1** the unacceptable anchor (veto). An aggregate **A = 0** can also result from the zero floor when penalising requirements lower an otherwise compliant result; the reported reason distinguishes these cases. Information-only requirements are excluded from the score.
- Requirements are **mandatory**, **penalising** or **information only**.
- **Sign rule:** A is negative **if and only if** a mandatory limit is violated. Penalising requirements can lower A
  down to 0 but never make it negative. Whether a result is automatically accepted or rejected depends on the owner-defined thresholds and their inclusive/exclusive boundary letters; otherwise the owner decides.
- The size of A combines the weakest mandatory score with the importance-weighted average of decision-relevant
  requirements (share β, shown on the notation). Completeness n/N counts all mandatory and penalising requirements, not information-only fields. Before final clipping and rounding, the unrounded parts in the contribution bar sum exactly to A; the displayed two-decimal labels may show a small rounding residual.
- The owner **locks** the specification (SHA-256 over a canonical JSON form; 12 characters shown on the notation),
  the submitter only enters values, and the owner confirms the decision.

## Tests
```
node tests/core.test.js     # 34 passing assertions in 14 test blocks (Appendix D)
node tests/simulation.js    # fixed-seed synthetic simulation of Section 9.1 (three generators, Table 8)
```

## Disclaimer / Sorumluluk reddi
This software and the method are provided **"as is", without warranty of any kind**. The software and its
calculations may contain errors. Verifying the results, making decisions and all consequences of those decisions
are **entirely the user's responsibility**; the author accepts no liability. Check results independently, especially
for safety-critical decisions. The tool is a decision-support and presentation layer: it does not replace
regulatory or contractual conformity, certification or approval procedures, and it is not an official record or approval system. See also the warranty and liability sections of the Apache-2.0 licence.

Bu yazılım ve yöntem **olduğu gibi, herhangi bir garanti olmaksızın** sunulmaktadır. Yazılımda ve hesaplarda hata
bulunabilir. Sonuçların doğrulanması, kararların verilmesi ve bunlardan doğacak her türlü sonuç **tamamen kullanıcının
sorumluluğundadır**; yazar hiçbir sorumluluk kabul etmez. Özellikle güvenlik açısından kritik kararlarda sonuçları
bağımsız olarak kontrol edin.

## Use
Open `index.html` in any current browser (works offline, sends no data to any server).

1. **Write the specification** (owner) – for each requirement: direction, limit, full-score value, optional unacceptable value, whether the limit value itself is **included** or **excluded**, type (mandatory / penalising / information) and importance. Choose the thresholds, review the pre-lock scenario table and lock it. The **lock code** (SHA-256 over the canonical JSON) identifies this exact version.
2. **Share it** – copy the link or export the locked specification as JSON. The submitter cannot change the rules.
3. **Enter results** (submitter) – values, ± uncertainty, calculation notes and **text references** to evidence. The decision number, the scale chart and the contribution bar update live.
4. **Review and decide** (owner) – in the same browser session, review A, the binding requirement and the reasons, and record **Accept / Conditional acceptance / Reject** with a justification.

This release does **not** upload evidence files and does **not** export or import completed reports; values, notes and the decision are held only in the current browser session. An independent verifier needs the complete input record transferred separately (for example in a controlled spreadsheet, see Appendix B of the paper).

All worked examples of the paper are available from the example menu.

## Files
| File | Purpose |
|---|---|
| `index.html` | Complete tool, single file |
| `src/core.js` | Scoring, decision rule and SHA-256 engine (also embedded in `index.html`) |
| `src/page_template.html` | Page template from which `index.html` is assembled (core inserted at `/*CORE*/`) |
| `tests/core.test.js` | Unit and property tests (`node tests/core.test.js`) |
| `tests/simulation.js` | Fixed-seed synthetic simulation of Section 9.1 (`node tests/simulation.js`) |
| `CITATION.cff` | Citation metadata |
| `CHANGELOG.md` | Changes between releases |

## Publish as a web page
Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.

## Cite
Özkul, İ. (2026). *Özkul Decision Number – reference implementation* [Software].
https://github.com/iskenderozkul/OzkulDecisionNumber

## Simulation scope
Three fixed-seed generators of 20,000 synthetic specifications each are run: U (shallow violations, uniform 0.85–2.15), D (deep violations, uniform 0.20–2.00) and N (typical margins, normal mean 1.45, sd 0.30). They are stress tests, not models of the empirical distribution of engineering specifications. Eq. (5) has zero false passes and zero false fails by Theorem 2(i); the simulation checks the implementation and quantifies how often the compensatory comparators err and how easily padding flips them.

## Limits
The fingerprint makes changes detectable; it does not prove authorship. For contractual use, sign it digitally. The proposed user study is a protocol only; no participant results are claimed.

## License
Apache-2.0
