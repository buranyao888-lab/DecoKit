# DecoKit — Tile Merchant Difference Advisory — Frozen Decisions

Status: FROZEN
Type: Documentation-only decision checkpoint (pre-v1 Tile UX patch)
Authorized baseline: `32a35da95dfdbf185465ee3f22c7d183dc89b2ed` (feat: implement M4 minimum analytics)

## 0. Scope and precedence

- This document freezes a **narrow, explanatory UI advisory** for the existing Tile `LARGE_DIFFERENCE` merchant-difference band.
- It is **documentation only**. No production code, test, formula, or analytics change is performed here.
- This document **supplements** existing frozen semantics. It does **not** supersede `formulas.md`, `PRD.md`, `AI_HANDOFF.md`, `M2_DECISIONS.md`, `M3_DECISIONS.md`, `M3_5_DECISIONS.md`, or `M4_DECISIONS.md`.
- No existing frozen document is modified by this package.

### Naming note

The brief for this package referred to the `>10% and <=20%` band as `CLEARLY_HIGH`. The identifier actually frozen in `utils/calculators/tile.js` is **`SIGNIFICANTLY_HIGH`**. This document uses the code identifier. No band semantics change.

---

## D1 — Calculator scope

**Tile only.**

The advisory applies to Tile exclusively.

Merchant comparison and advisory behavior must **not** be added to:

- flooring
- paint
- grout
- curtain
- budget

Merchant comparison outside Tile remains **deferred** (`M3_DECISIONS.md`: "Merchant comparison outside Tile — DEFERRED — no frozen formula or band exists").

## D2 — Difference metric

Reuse the existing frozen Tile metric **exactly**:

```
merchantExcessRate = (merchantPieces - recommendedPieces) / recommendedPieces
```

Prohibited:

- absolute-difference metric
- symmetric metric
- any new calculation
- any UI-side recomputation of the rate

## D3 — Trigger

The explanatory advisory appears **only** when the existing Engine result is:

```
merchantDifferenceBand === LARGE_DIFFERENCE
```

This corresponds to the existing frozen condition:

```
merchantExcessRate > 20%
```

Mandatory constraints:

- The UI must **not** independently recalculate `20%`.
- The UI must **not** contain a duplicated numeric threshold.
- Advisory visibility must be derived from the existing semantic value `merchantDifferenceBand`.

## D4 — Direction

Existing directional behavior is maintained.

- The advisory applies **only** through the existing `LARGE_DIFFERENCE` band.
- **No** advisory is created for merchant quantity **below** the DecoKit recommendation.
- Prohibited new semantics: "merchant too low", "under-ordering", "insufficient quantity", "below reference risk".
- Merchant quantities below the recommendation remain classified `NORMAL_REFERENCE_RANGE` under existing frozen semantics.
- `M2_DECISIONS.md` and `M3_DECISIONS.md` prohibitions on a merchant-below-reference risk band are **not** overturned.

## D5 — No cross-calculator threshold

- **No** universal merchant-difference threshold is created.
- The existing `>20%` threshold remains a **Tile-only** frozen rule.
- No implication may be made that `20%` is appropriate for Flooring, Paint, Grout, Curtain, or Budget.

## D6 — Classification

The enhancement is a **UI ADVISORY**.

It is **not**:

- an Engine warning
- a risk warning
- a validation error
- a confidence modifier
- a calculation error

It must **not** enter:

- `meta.warnings`
- `fieldErrors`
- `pageError`
- `rawError`
- `confidence`

## D7 — User-facing copy

The existing short band message remains **unchanged**:

```
差异较大，建议重新核算
```

A second explanatory advisory is added **below** it. Frozen exact copy:

```
商家建议量与参考推荐量差异较大，可能与铺贴方式、切割损耗、备用砖预留或现场情况有关，建议确认计算口径后再核对采购数量。
```

Constraints:

- The existing short band message is **not** replaced.
- No accusatory wording: `被坑`, `欺诈`, `虚高`, `乱报价`, `多卖`, `商家错误`, `商家算错`, `过度采购`.
- The advisory must **not** claim DecoKit is definitely correct.

## D8 — UI placement

- The advisory belongs **inside** the existing Tile `商家建议量对比` presentation/card.
- It renders directly below or immediately adjacent to the existing merchant band message.
- It must **not**:
  - appear in the primary recommendation card
  - appear in the Engine warning area
  - replace confidence
  - compete visually with `recommendedPieces` as the primary result
- It is **visually secondary** to `差异较大，建议重新核算`.

## D9 — State / invalidation

Reuse existing Tile state behavior. **No new persistent page state** is required, and no independent advisory lifecycle machinery is introduced.

Expected behavior:

| scenario | behavior |
|---|---|
| no merchant value | no merchant comparison, no advisory |
| merchant value changed | existing result invalidation |
| merchant value cleared | comparison disappears, advisory disappears |
| core input changed | existing result invalidation |
| reset | advisory disappears via existing reset behavior |
| recalculate | advisory recomputed from current Engine band |

## D10 — Engine / formulas immutability

Do **not** modify:

- `formulas.md`
- `utils/calculators/tile.js`
- any other `utils/calculators/*`

Do **not** change:

- `recommendedPieces`
- `lossRate`
- `merchantExcessRate`
- `merchantDifferenceBand`
- `confidence`
- `warnings`
- `validation`
- `rounding`
- merchant input semantics

The Engine remains the **sole authority** for the existing band.

## D11 — Analytics exclusion

M4 remains completely frozen.

- Do **not** modify `utils/analytics.js`.
- No analytics for: `merchantPieces`, `merchantExcessRate`, `merchantDifferenceBand`, advisory shown, difference percentage, merchant comparison.
- The only M4 custom event remains `calculation_success` with payload exactly:

```json
{ "calculator": "<key>" }
```

For Tile:

```json
{ "calculator": "tile" }
```

## D12 — Test boundary

Future implementation must test at minimum:

1. no merchant value → no advisory
2. existing non-`LARGE_DIFFERENCE` band → no explanatory advisory
3. existing `LARGE_DIFFERENCE` band → explanatory advisory present
4. threshold boundary remains controlled by Engine tests; UI must not duplicate numerical threshold logic
5. merchant lower than recommendation → no new lower-direction advisory
6. merchant input edited → existing invalidation removes stale advisory/result
7. merchant input cleared → comparison/advisory absent after recalculation
8. reset → advisory absent
9. exact frozen advisory copy is present
10. Engine semantics unchanged
11. M4 analytics payload unchanged

Existing Engine threshold tests must **not** be rewritten.

## D13 — Release scope

This enhancement is authorized as a **small pre-v1 release UX patch**.

It is **not**:

- M3.5C
- a new calculator milestone
- a merchant-pricing system
- a quote-analysis system
- a new M4 analytics package

After implementation and validation it becomes part of DecoKit v1.0.

## D14 — Documentation location

- These decisions live in `TILE_MERCHANT_ADVISORY_DECISIONS.md`.
- Do **not** reopen or rewrite `formulas.md`, `M2_DECISIONS.md`, `M3_DECISIONS.md`, `M3_5_DECISIONS.md`, or `M4_DECISIONS.md`.

---

## Implementation architecture (frozen intent)

```
existing Engine: merchantDifferenceBand
        ↓
pages/tile/tile.js  formatResult()
        ↓
derive presentation-only advisory visibility/content
        ↓
displayResult
        ↓
existing merchant comparison card in tile.wxml
```

- The page must **not** recalculate `merchantExcessRate` or numeric band boundaries.
- Prefer deriving a **presentation-only boolean/string** from the semantic band.
- **No new Engine output is required.**

## Expected future implementation scope

MODIFY:

- `pages/tile/tile.js`
- `pages/tile/tile.wxml`
- `pages/tile/tile.wxss`

TESTS:

- `tests/ui/page-contracts.test.js`

OPTIONAL:

- `tests/ui/m3-5-presentation.test.js` — only if existing test architecture makes it the more appropriate location.

NOT MODIFIED:

- No Engine modification (`utils/calculators/*`)
- No `formulas.md` modification
- No analytics modification (`utils/analytics.js`)
- No other calculator modification
- No project config modification

## Not included in this document

- Real AppID / `project.config.json` local migration state — intentionally excluded; no AppID value appears in this document.
- M5 release decisions (`M5_DECISIONS.md`) — not created here.
- Broader merchant-difference framework (`MERCHANT_DIFFERENCE_DECISIONS.md`) — not created here.

---

Frozen by: Tile Merchant Difference Advisory Decision Freeze
Baseline: `32a35da95dfdbf185465ee3f22c7d183dc89b2ed`
