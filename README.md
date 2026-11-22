# Özkul Decision Number

Reference implementation of the **Özkul Decision Number (A)**, a signed, saturating and inflation-proof way of
communicating whether a piece of work meets a multi-parameter specification.

**Try it online:** https://iskenderozkul.github.io/OzkulDecisionNumber/

**Paper:** İ. Özkul, *The Özkul Decision Number: a signed, decomposable summary of multi-requirement specification
compliance* (manuscript, 2026).

## What it does
- Every decision-relevant requirement (mandatory or penalising) is mapped to a score on one fixed ruler: **+1** full score, **0** the compliance boundary, and **−1** the unacceptable anchor (veto). An aggregate **A = 0** can also result from the zero floor when penalising requirements lower an otherwise compliant result; the reported reason distinguishes these cases. Information-only requirements are excluded from the score.
- Requirements are **mandatory**, **penalising** or **information only**.
- **Sign rule:** A is negative **if and only if** a mandatory limit is violated. Penalising requirements can lower A
  down to 0 but never make it negative. Whether a result is automatically accepted or rejected depends on the owner-defined thresholds and their inclusive/exclusive boundary letters; otherwise the owner decides.
- The size of A combines the weakest mandatory score with the importance-weighted average of decision-relevant
  requirements (share β, shown on the notation). Completeness n/N counts all mandatory and penalising requirements, not information-only fields. A is exactly the sum of the parts drawn in the contribution bar.
- The owner **locks** the specification (SHA-256 over a canonical JSON form; 12 characters shown on the notation),
  the submitter only enters values, and the owner confirms the decision.

## Tests
```
node tests/core.test.js     # 20 passing assertions in 10 blocks; see Section 4.6 and Table 10
node tests/simulation.js    # fixed-seed uniform synthetic simulation of Section 9.1
```

## Disclaimer / Sorumluluk reddi
This software and the method are provided **"as is", without warranty of any kind**. The software and its
calculations may contain errors. Verifying the results, making decisions and all consequences of those decisions
are **entirely the user's responsibility**; the author accepts no liability. Check results independently, especially
for safety-critical decisions. See also the warranty and liability sections of the Apache-2.0 licence.

Bu yazılım ve yöntem **olduğu gibi, herhangi bir garanti olmaksızın** sunulmaktadır. Yazılımda ve hesaplarda hata
bulunabilir. Sonuçların doğrulanması, kararların verilmesi ve bunlardan doğacak her türlü sonuç **tamamen kullanıcının
sorumluluğundadır**; yazar hiçbir sorumluluk kabul etmez. Özellikle güvenlik açısından kritik kararlarda sonuçları
bağımsız olarak kontrol edin.

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

## Simulation scope
The 20,000-case run uses a fixed-seed uniform synthetic generator. It is a stress test, not a model of the empirical distribution of engineering specifications. Eq. (5) has zero false passes by Theorem 2(i); the simulation checks the implementation and illustrates the behaviour of the compensatory comparators.

## Limits
The fingerprint makes changes detectable; it does not prove authorship. For contractual use, sign it digitally. The proposed user study is a protocol only; no participant results are claimed.

## License
Apache-2.0
