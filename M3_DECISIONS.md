# DecoKit M3 UI Integration Decisions

**Document type:** M3 UI Integration implementation decision record  
**Scope:** M3 UI Integration only  
**Baseline:** `7246316f80ad606f8f56fff39b74d3f2efe58235`

## Priority and Authority

1. `PRD.md`, `AI_HANDOFF.md`, `formulas.md`, `analytics.md`, and `M2_DECISIONS.md` remain authoritative.
2. The committed M2 Calculator Engine contract is the only calculation interface used by M3 pages.
3. `formulas.md` remains the sole source of business formulas, defaults, loss rates, rounding rules, risk bands, and confidence semantics.
4. This record freezes only M3 page, input-boundary, presentation, and interaction decisions. It does not override or reinterpret M2 business rules.
5. If implementation requires a Calculator Engine change, implementation must stop and report `M2 DEFECT`; M3 must not repair it implicitly.

## Decision 1 — Engine Integration

The six tool pages must import the public entry at `utils/calculators/index.js` and call the corresponding function:

- `calculateTile`
- `calculatePaint`
- `calculateGrout`
- `calculateFlooring`
- `calculateCurtain`
- `calculateBudget`

Pages and UI helpers must not copy or reimplement:

- formulas;
- loss calculations or rates;
- coverage calculations;
- reserve calculations;
- `ceil` rules;
- grout volume calculations;
- budget summation;
- merchant comparison calculations or bands.

Pages must render the Calculator result contract. They must not generate business results independently or substitute formatted values for raw Calculator results.

## Decision 2 — Strict UI Number Parsing

Pages keep numeric user input as raw strings until calculation is requested. Parsing is centralized in one pure presentation/input-boundary helper.

The frozen decimal grammar is:

```text
^-?(?:\d+(?:\.\d+)?|\.\d+)$
```

This grammar accepts:

- ordinary integers such as `12` and `0`;
- ordinary decimals such as `12.5`, `0.5`, and `.5`;
- a leading negative sign, including `-1`, `-0.5`, and `-.5`.

It does not accept a leading plus sign, a trailing decimal point, or arbitrary JavaScript numeric syntax.

The parser rejects:

- whitespace-only input;
- leading or trailing whitespace;
- `NaN`;
- `Infinity` and `-Infinity`;
- scientific notation such as `1e3`;
- hexadecimal such as `0x10`;
- comma-formatted numbers such as `1,000`;
- unit suffixes such as `12mm`;
- multiple decimal points.

Only after lexical validation may the parser convert the string with `Number`. The converted result must satisfy `Number.isFinite(value) === true`.

An exact empty string has two meanings:

- required field: return a UI missing-field result;
- optional field: omit the field from the Calculator input object.

Lexically valid zero and negative numbers are passed to the Calculator Engine. The UI parser must not duplicate positive, non-negative, range, or relationship validation owned by the Engine.

Controlled enum and boolean inputs must produce supported enum values and literal `true` or `false`; they do not use the number parser.

## Decision 3 — Tile UI

The Tile page maps these inputs directly to the Calculator:

- `areaM2`;
- `tileLengthMm`;
- `tileWidthMm`;
- `layingMode`;
- optional `piecesPerBox`;
- optional `merchantPieces`.

`layingMode` has no UI default. The user must explicitly select one supported value:

- `straight`;
- `staggered`;
- `complex`.

The page displays these Engine outputs when present:

- `theoreticalPieces`;
- `recommendedPieces`;
- `lossRate`;
- `boxes`;
- `merchantExcessRate`;
- `merchantDifferenceBand`;
- confidence.

Optional empty inputs are omitted. The page must not recalculate pieces, boxes, loss, merchant excess, or merchant bands.

Merchant comparison maps only the existing Engine semantics:

- `NORMAL_REFERENCE_RANGE`;
- `SLIGHTLY_HIGH`;
- `SIGNIFICANTLY_HIGH`;
- `LARGE_DIFFERENCE`.

M3 must not add a merchant-below-reference risk band or change how the Engine classifies a negative excess rate.

## Decision 4 — Paint UI

The initial Paint mode is `direct`.

Direct mode displays and sends:

- `mode = direct`;
- required `paintAreaM2`.

Assisted mode displays and sends:

- `mode = assisted`;
- required `perimeterM`;
- required `heightM`;
- required `openingsAreaM2`;
- required literal boolean `includeCeiling`;
- required `ceilingAreaM2` only when `includeCeiling === true`.

The initial `includeCeiling` value is `false`. A hidden ceiling-area field must not be sent to the Calculator.

Face-paint advanced parameters are collapsed initially. Their defaults must be read from or strictly correspond to the frozen M2 defaults:

- coverage: `13` ㎡/L/coat;
- coats: `2`;
- reserve: `10%` in the UI and `0.10` in the Calculator input.

The UI exposes only the frozen face-paint adjustment ranges. Reserve is displayed as `0–20%` and divided by 100 once when constructing the Calculator input. This is representation conversion only.

Primer overrides, package or bucket counts, and a building-area multiplier mode are not exposed.

The page displays at least:

- `paintAreaM2`;
- `facePaintLiters`;
- `primerLiters`;
- confidence.

Assisted-mode intermediate area fields may be presented as secondary explanation using the values returned by the Engine.

## Decision 5 — Grout UI

The Grout page maps:

- `areaM2`;
- `tileLengthMm`;
- `tileWidthMm`;
- `jointWidthMm`;
- optional `jointDepthMm`.

When joint depth is empty, the page omits `jointDepthMm` and lets the Engine apply its frozen default.

Primary results are:

- `totalJointLengthM`;
- `volumeMl`;
- confidence.

`jointLengthPerM2` may be secondary explanatory information. `volumeM3` and internal unit-conversion fields do not need primary presentation.

The page must render the `GROUT_REFERENCE_ONLY` warning.

M3 must not add brand inputs, cartridge capacity, `effectiveYieldFactor`, product coverage assumptions, or recommended purchase quantities.

## Decision 6 — Flooring UI

The Flooring page maps:

- `netAreaM2`;
- `layingMode`;
- `irregularRoom`;
- optional `boxCoverageM2`.

`layingMode` has no UI default. The user must explicitly select:

- `straight`;
- `staggered`;
- `herringbone`.

The initial `irregularRoom` value is `false` and must be passed as a literal boolean.

The page displays:

- `lossRate`;
- `purchaseAreaM2`;
- `boxes` when present;
- confidence.

The UI formats the returned `lossRate` as a percentage. It must not calculate a preset rate, add the irregular-room increment, apply the automatic cap, calculate purchase area, or calculate boxes.

## Decision 7 — Curtain UI

The Curtain page maps:

- `trackWidthM`;
- `fullness`;
- `panels`.

The UI defaults must come from or strictly correspond to the Engine defaults:

- `fullness = 1.8`;
- `panels = 2`.

The UI offers only the frozen allowed values:

- fullness: `1.5`, `1.8`, `2.0`;
- panels: `1`, `2`.

The page displays:

- `totalFinishedWidthM`;
- `singlePanelWidthM`;
- confidence.

It must render `CURTAIN_HEIGHT_MEASUREMENT_REQUIRED`. M3 must not add a precise height Calculator, cutting-height output, or an inferred height.

## Decision 8 — Budget UI

The M3 Budget page is a manual ten-component sum. It is not an automatic market-price generator.

The following inputs are all required:

| Chinese label | Calculator field |
| --- | --- |
| 基础施工 | `baseConstruction` |
| 水电工程 | `plumbingElectrical` |
| 瓦工工程 | `masonry` |
| 木工工程 | `carpentry` |
| 油漆工程 | `painting` |
| 主材 | `mainMaterials` |
| 定制 | `customization` |
| 厨卫 | `kitchenBathroom` |
| 安装 | `installation` |
| 预备金 | `contingency` |

An explicit input of `0` is valid. An empty field must not be converted to zero.

M3 does not expose or generate:

- `city`;
- `level`;
- `version`;
- `updated_at`;
- `source`.

M3 must not estimate amounts from area, city, renovation level, market averages, network data, or AI.

The page displays:

- `totalBudget`;
- confidence;
- `BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION`.

## Decision 9 — Confidence Presentation

M3 displays an explicit text confidence label using this frozen mapping:

- `high` → `高可信度`;
- `medium_high` → `较高可信度`;
- `reference` → `参考估算`;
- `rough` → `粗略估算`.

Confidence must not be converted to a percentage, star rating, AI score, or newly invented scale.

## Decision 10 — Warning Presentation

The frozen M3 warning mapping is:

### `GROUT_REFERENCE_ONLY`

`理论填充量仅供参考；实际用量受产品配比、残留和施工损耗影响，请以产品包装说明为准。`

### `CURTAIN_HEIGHT_MEASUREMENT_REQUIRED`

`本工具只计算宽度。安装方式、挂钩、离地、缝边和面料缩水都会影响高度，请现场测量确认。`

### `BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION`

`预算粗估，不是装修报价。`

A warning is presented with a successful result. It must not block result display or be converted into a calculation error.

Unknown warning codes must not be silently discarded. They receive a neutral page-level fallback while the original code remains available for diagnosis.

## Decision 11 — Error Presentation

The original Engine error code and field remain in page state for logic and tests. Users see Chinese presentation text.

The frozen basic mapping is:

- `INVALID_INPUT` → `页面数据无效，请检查输入后重试`;
- `MISSING_REQUIRED_FIELD` → `请填写此项`;
- `MISSING_BUDGET_COMPONENT` → `请填写该预算项目，金额可以为 0`;
- `INVALID_NUMBER` → `请输入有效数字`;
- `INVALID_BOOLEAN` → `请选择有效选项`;
- `INVALID_ENUM` → `请选择有效选项`;
- `CALCULATION_RANGE` → `输入数值过大，无法完成计算，请检查后重试`.

`OUT_OF_RANGE` presentation uses only the Engine field and existing details to describe:

- a positive-value requirement;
- an already frozen minimum or maximum;
- an already frozen field relationship.

It must not create a new business range.

Errors with a safely identifiable input field are field-level. Errors without a field, errors targeting calculated output fields, and errors that cannot be safely located are page-level.

On error, the page keeps all user input, does not swallow the error, and does not clear the whole form. Unknown error codes use a neutral page-level fallback and retain the original code.

## Decision 12 — Display Formatting

All formatting is presentation-only. Each page retains the raw Calculator result, and formatted strings must never be sent back to a Calculator.

### Integer quantities

Piece and box quantities display as integers.

### Measurement and volume

Values in m, ㎡, L, and ml:

- display at most two decimal places;
- remove insignificant trailing zeros;
- display a positive value below `0.01` as `<0.01`.

Display rounding must not change the raw result.

### Ratio

A ratio is multiplied by 100 for display only:

- at most one decimal place;
- append `%`;
- preserve a negative sign.

### Currency

Renminbi amounts:

- use a thousands separator;
- display at most two decimal places;
- remove insignificant trailing zeros.

## Decision 13 — Page State

Each page uses native `Page` local state. M3 does not add a global store, Redux-like architecture, or state-management dependency.

A page may keep:

- raw/form input;
- selected options;
- raw result;
- display result;
- field errors;
- page error;
- warnings;
- `hasCalculated`.

The six pages do not need mechanically identical state shapes. State should remain local and limited to the page interaction.

## Decision 14 — Result Invalidation

After a successful calculation, changing any field that affects the Calculator input immediately:

- clears the raw result;
- clears the display result;
- clears old warnings;
- sets `hasCalculated = false`.

The change clears only the field error associated with the edited field. Other input values remain unchanged.

M3 does not implement a stale badge or stale-result state.

## Decision 15 — Reset

Reset:

- clears raw and display results;
- clears all field and page errors;
- clears warnings;
- sets `hasCalculated = false`;
- restores UI defaults;
- does not invoke a Calculator.

Calculator defaults must come from or strictly correspond to the frozen Calculator defaults.

M3 UI defaults are:

- Paint mode: `direct`;
- Paint `includeCeiling`: `false`;
- Paint advanced section: collapsed;
- Curtain fullness: `1.8`;
- Curtain panels: `2`;
- Flooring `irregularRoom`: `false`;
- Tile `layingMode`: no selection;
- Flooring `layingMode`: no selection.

User-entered numeric fields without a frozen default return to an empty string.

## Decision 16 — Shared UI Helper

M3 may add:

```text
utils/calculator-ui.js
```

Its responsibilities are limited to:

- strict number parsing;
- presentation formatting;
- Engine error to Chinese presentation mapping;
- Engine warning to Chinese presentation mapping;
- confidence to Chinese label mapping.

It may read exported frozen Calculator defaults. It must not copy or contain:

- formulas;
- loss rates or loss calculations;
- coverage or reserve defaults duplicated as literals;
- `ceil` rules;
- grout calculations;
- budget summation;
- merchant comparison calculations or bands.

Calculator-specific input construction stays explicit and testable at the page boundary. The helper must not become a second Calculator layer.

## Decision 17 — Basic Native Share

M3 includes basic native WeChat sharing required by the authoritative specification. Sharing is limited to:

- the current tool name;
- the current page path;
- a neutral title in the form `装修计算工具 · <工具名称>`.

By default, share content does not include complete user inputs, amounts, areas, or detailed Calculator results.

M3 must not implement custom share-image generation, a sharing backend, network services, sharing analytics, PDF, or quotation export.

## Decision 18 — Analytics Boundary

M3 does not implement Analytics. It must not add:

- an analytics SDK;
- a tracking helper;
- placeholder tracking code;
- a network event;
- a Cloud event.

`analytics.md` remains unchanged. Future phases may integrate `tool_view`, `calculate`, `calculate_error`, `quote_compare`, and `result_share` at the corresponding completed user actions. M3 code must not depend on that future integration.

## Decision 19 — Test Boundary

After M3 implementation:

1. All existing M2 Calculator regression tests must continue to pass.
2. `calculator-ui.js` must have automated tests.
3. Tests must cover strict parsing and the exact decimal grammar.
4. Tests must cover display formatting.
5. Tests must cover error mapping.
6. Tests must cover warning mapping.
7. Tests must cover confidence mapping.
8. Tests must cover each page's UI-state-to-Calculator-input mapping.
9. Tests must cover omission of empty optional and hidden conditional fields.
10. Tests must cover result invalidation and reset.
11. Static review must verify that pages do not copy Calculator formulas or constants.
12. Static review must verify that pages call the public Calculator API.

Node tests do not constitute WeChat UI testing. If WeChat DevTools cannot be executed in the implementation environment, the final implementation report must state:

`Manual WeChat DevTools acceptance required`

## Decision 20 — M3 File Scope

M3 implementation may modify by default:

```text
pages/tile/tile.js
pages/tile/tile.wxml
pages/tile/tile.wxss

pages/paint/paint.js
pages/paint/paint.wxml
pages/paint/paint.wxss

pages/grout/grout.js
pages/grout/grout.wxml
pages/grout/grout.wxss

pages/flooring/flooring.js
pages/flooring/flooring.wxml
pages/flooring/flooring.wxss

pages/curtain/curtain.js
pages/curtain/curtain.wxml
pages/curtain/curtain.wxss

pages/budget/budget.js
pages/budget/budget.wxml
pages/budget/budget.wxss
```

M3 implementation may add:

```text
utils/calculator-ui.js
tests/ui/calculator-ui.test.js
tests/ui/page-contracts.test.js
```

It may modify `app.wxss` only for presentation styles genuinely shared by the six pages, limited to form, button, result, error, and warning styles.

It may modify `package.json` only to include M3 tests in the standard test command.

The six page `.json` files remain unchanged by default. Any required native page configuration change must be explained in the implementation report.

The following must remain unchanged:

- `PRD.md`;
- `AI_HANDOFF.md`;
- `formulas.md`;
- `analytics.md`;
- `M2_DECISIONS.md`;
- `utils/calculators/*`;
- `tests/calculators/*`;
- `app.js`;
- `app.json`;
- `project.config.json`;
- `sitemap.json`;
- `pages/index/*`.

If implementation requires a change under `utils/calculators/*`, it must stop and report `M2 DEFECT` instead of changing the Engine during M3.

## Decision 21 — M3 Completion Boundary

M3 is complete when all six existing tool pages provide the local interaction:

```text
input
→ strict parsing
→ Calculator Engine
→ result or error and warnings
→ display
→ edit, recalculate, and reset
```

M3 also includes the basic native sharing defined in Decision 17.

M3 does not include:

- Analytics implementation;
- Cloud or database capabilities;
- remote pricing;
- login or account features;
- payment;
- advertising;
- AI;
- PDF or formal quotation;
- merchant backend;
- release or publishing;
- privacy or review work;
- advanced animation.

M3 implementation completion must retain the Calculator/UI boundary, pass automated checks, report any required manual WeChat DevTools acceptance, and create `M3_HANDOFF.md` only at the completion stage required by `AI_HANDOFF.md`.

## Ambiguity Coverage

| # | Topic | Status | Resolution or destination |
| - | ----- | ------ | ------------------------- |
| 1 | Ordinary numeric lexical grammar | RESOLVED IN M3 | Decision 2 freezes a decimal-only grammar and accepts `.5`. |
| 2 | Scientific notation | RESOLVED IN M3 | Decision 2 rejects scientific notation. |
| 3 | Display decimal places and trailing zeros | RESOLVED IN M3 | Decision 12 freezes measurement, ratio, currency, and integer display rules. |
| 4 | Initial Tile and Flooring laying modes | RESOLVED IN M3 | Decisions 3 and 6 require explicit selection with no default. |
| 5 | Initial Paint mode | RESOLVED IN M3 | Decision 4 sets `direct`. |
| 6 | Paint advanced-option layout | RESOLVED IN M3 | Decision 4 makes it collapsed initially. |
| 7 | Paint reserve representation | RESOLVED IN M3 | Decision 4 uses percent in UI and ratio in Calculator input. |
| 8 | Initial `includeCeiling` value | RESOLVED IN M3 | Decision 4 sets `false`. |
| 9 | Chinese error and warning wording | RESOLVED IN M3 | Decisions 10 and 11 freeze the base presentation mappings. |
| 10 | Result behavior after input changes | RESOLVED IN M3 | Decision 14 immediately invalidates and clears the old result. |
| 11 | Basic share title and included content | RESOLVED IN M3 | Decision 17 freezes a neutral title and excludes detailed input/result data. |
| 12 | Budget city, level, version, and update-time source | DEFERRED | A later authorized phase may use a trustworthy configuration source; M3 neither collects nor invents metadata. |
| 13 | Merchant comparison outside Tile | DEFERRED | No frozen formula or band exists; implementation requires future authoritative specification. |
| 14 | Home-page disclaimer entry | DEFERRED | `AI_HANDOFF.md` assigns privacy and disclaimer work to M5. |
| 15 | Advanced share image, PDF, or sharing backend | DEFERRED | These capabilities are outside M3 and require separate future scope. |

Coverage summary:

- total ambiguities: 15;
- resolved in M3: 11;
- deferred: 4;
- remaining blockers: 0.

All M3 UI decisions identified in the Preflight are resolved by this record. Deferred items must not be implemented during M3.
