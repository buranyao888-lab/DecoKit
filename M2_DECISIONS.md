# DecoKit M2 Calculator Engine Decisions

**Document type:** M2 Calculator Engine implementation decision record
**Scope:** M2 Calculator Engine only

## Priority and Authority

1. The business formulas and parameters already frozen in `formulas.md` have the highest priority.
2. This document only fills engineering and product-boundary gaps that the frozen specification did not fully define.
3. This document must not override, reinterpret, or replace any formula, default parameter, waste rate, rounding rule, risk band, or confidence level already frozen in `formulas.md`.
4. If an implementation choice would conflict with `formulas.md`, implementation must stop and request clarification.

## Decision 1 — Grout

M2 implements only the grout calculations that are fully determined by the frozen specification:

- unit joint length;
- total joint length;
- theoretical fill volume;
- `volumeM3`;
- `volumeMl`;
- `confidence = reference`.

M2 must not:

- guess brand-specific coverage;
- guess cartridge capacity;
- guess an `effectiveYieldFactor`;
- define a new mathematical relationship for `effectiveYieldFactor`;
- calculate a recommended purchase quantity without reliable product parameters.

The M2 default result does not include a recommended cartridge count. Missing product parameters do not make the theoretical-volume calculation fail. A successful result must include a stable warning semantic meaning “result for reference only.”

Tests must verify the frozen geometry and unit conversions independently of any cartridge-yield assumptions.

## Decision 2 — Budget

The M2 Budget Calculator is a budget-component aggregation engine. It is not a market renovation price generator.

The only calculation is the frozen sum:

```text
totalBudget =
baseConstruction
+ plumbingElectrical
+ masonry
+ carpentry
+ painting
+ mainMaterials
+ customization
+ kitchenBathroom
+ installation
+ contingency
```

All ten components must be explicitly provided:

- `baseConstruction`
- `plumbingElectrical`
- `masonry`
- `carpentry`
- `painting`
- `mainMaterials`
- `customization`
- `kitchenBathroom`
- `installation`
- `contingency`

Each component must be a finite JavaScript `number` greater than or equal to zero. If any component is missing, calculation fails with a structured error carrying the semantic `MISSING_BUDGET_COMPONENT`. The exact technical error code may vary only if it preserves that semantic.

M2 must not derive component amounts from city, area, renovation level, market averages, network data, or AI. It must not add nationwide per-square-metre prices or invent prices for economic, standard, improved, or premium levels.

Budget confidence is `rough`. A successful result must include a stable warning semantic meaning “预算粗估，不是装修报价”.

If the caller supplies `city`, `level`, `version`, `updated_at`, or `source`, M2 may pass those values through as metadata. Metadata must not affect the calculation. M2 does not determine whether configuration is expired and must not use system time.

## Decision 3 — Tile Preset Waste Rates

M2 supports only these frozen `layingMode` presets:

- `straight` → `0.05`
- `staggered` → `0.08`
- `complex` → `0.10`

M2 does not accept a custom `lossRate`, calculate special-pattern waste, or guess a special-pattern waste rate. A `layingMode` outside the three presets returns a structured invalid-mode error.

The adjustable ranges in `formulas.md` remain product guidance and are not exposed through the M2 Calculator Contract.

Tile merchant comparison remains part of the pure calculation layer because its formula and bands are frozen. It must use the existing bands exactly, including the existing `<= 5%` rule. M2 must not add a separate risk band for merchant quantities below the recommendation.

## Decision 4 — Flooring Preset Waste Rates

M2 supports only these frozen `layingMode` presets:

- `straight` → `0.05`
- `staggered` → `0.08`
- `herringbone` → `0.15`

When `irregularRoom === true`, M2 adds `0.02` to the selected preset rate. The automatically calculated waste rate must not exceed `0.20`, even though the currently defined presets do not reach that cap.

M2 does not accept a custom `lossRate` or a custom rate above 20%. An unsupported `layingMode` returns a structured invalid-mode error.

## Decision 5 — Paint Input Modes and Parameters

Paint input uses an explicit `mode` with exactly two accepted values:

- `direct`
- `assisted`

M2 must not infer the mode from field presence.

### Direct mode

- `paintAreaM2` is required.
- `paintAreaM2` must be greater than zero.
- Assisted-area fields do not participate in the formula.

### Assisted mode

The following fields are required:

- `perimeterM > 0`
- `heightM > 0`
- `openingsAreaM2 >= 0`
- `includeCeiling` must be a boolean

M2 calculates:

```text
grossWallAreaM2 = perimeterM * heightM
```

`openingsAreaM2` must be less than `grossWallAreaM2`. M2 then applies the frozen formulas:

```text
wallNetArea = grossWallAreaM2 - openingsAreaM2
paintAreaM2 = wallNetArea + (includeCeiling ? ceilingAreaM2 : 0)
```

When `includeCeiling === true`, `ceilingAreaM2 > 0` is required. When `includeCeiling === false`, ceiling area does not participate in the formula.

M2 does not implement a precise building-area multiplier mode.

### Paint parameters

Face-paint defaults remain:

- coverage: `13` ㎡/L/coat
- coats: `2`
- reserve: `0.10`

Face-paint advanced inputs may use only the frozen ranges:

- coverage: `10` through `16`
- coats: `1` through `3`
- reserve: `0` through `0.20`

Primer parameters are not customizable in M2. M2 always uses the frozen primer defaults:

- coverage: `11` ㎡/L/coat
- coats: `1`
- reserve: `0.10`

M2 returns calculated litres only. It does not calculate package or bucket counts and does not define package sizes.

## Decision 6 — Curtain

Curtain inputs are frozen as follows:

- `trackWidthM > 0`
- default `fullness = 1.8`
- allowed `fullness` values: `1.5`, `1.8`, `2.0`
- default `panels = 2`
- allowed `panels` values: `1`, `2`

M2 uses the existing formulas exactly:

```text
totalFinishedWidthM = trackWidthM * fullness
singlePanelWidthM = totalFinishedWidthM / panels
```

Height does not participate in precise calculation, and M2 must not derive a cutting height. A successful result must retain a warning semantic stating that installation method, hooks, floor clearance, hems, and fabric shrinkage can affect height.

## Decision 7 — Global Validation Contract

### Numbers

A numeric input must:

- have JavaScript type `number`;
- satisfy `Number.isFinite(value) === true`.

M2 does not accept numeric strings, `NaN`, `Infinity`, `-Infinity`, `null`, or booleans as numbers.

Business quantities that require positive values must be greater than zero. Fields explicitly allowed to be zero, including eligible rates and budget components, must be greater than or equal to zero. The general positive-number rule must not reject a zero explicitly allowed by the frozen specification or this decision record.

### Booleans

Boolean inputs must be the literal values `true` or `false`. M2 does not coerce `0`, `1`, `"true"`, or `"false"`.

### Optional fields

Only fields explicitly marked optional may be omitted.

### Calculation range

M2 does not invent a business upper bound where the frozen specification defines none. If finite input causes any intermediate or final calculated number to become `NaN`, `Infinity`, or `-Infinity`, calculation fails with a structured calculation-range error. A calculator must never return a non-finite calculated value.

## Decision 8 — Floating Point and Rounding

M2 uses JavaScript `number`. It does not add Decimal, BigNumber, or fixed-point money libraries.

M2 applies `Math.ceil` only where `formulas.md` explicitly requires `ceil`. Every other result retains its original numeric precision. Calculator code must not use `toFixed`, round to UI decimal places, or return formatted numeric strings.

Tests must cover floating-point boundaries for purchase quantities that require `ceil`. Implementation must not introduce a business tolerance that changes the normal formula result. If a concrete boundary cannot be handled safely without a new business rule, it must be reported rather than resolved by changing the formula.

## Decision 9 — Calculator Purity

Every calculator must be:

- local;
- deterministic;
- pure;
- independent of UI code.

Calculator modules must not depend on `wx`, `Page`, `App`, WXML, page `data`, DOM, CloudBase, network access, system time, random values, or AI.

The same input must produce the same result. A calculator must not mutate the caller's input object.

## Decision 10 — Error and Warning Contract

M2 may define stable technical error and warning codes only for already frozen product semantics. Codes must not add a risk band, create a new business judgment, alter a formula, or alter confidence.

Expected invalid user input returns a structured result with:

```text
ok: false
```

It must not cause an uncaught exception.

A successful calculation returns:

```text
ok: true
```

Calculated values remain JavaScript numbers. Warning entries use stable semantic codes with optional structured details. Calculator modules do not compose complete Chinese UI messages.

## Decision 11 — Test Environment and Minimum Coverage

Before M2 implementation, the available JavaScript runtime must be checked.

- If Node.js is available, use its built-in test capability where possible and avoid a third-party test framework.
- If no executable JavaScript runtime is available, do not claim that tests passed and report the environment blocker.
- Test infrastructure must not alter product formulas.

Tests must cover at least:

- Formula Fidelity;
- Determinism;
- Purity;
- Validation;
- Rounding;
- Defaults;
- UI Independence.

## Decision 12 — Scope Discipline

M2 is limited to the Calculator Engine. M2 must not modify the six existing tool pages or implement:

- complete result or form UI;
- Analytics;
- Cloud capabilities;
- login;
- payment;
- advertising;
- sharing;
- AI;
- network pricing;
- release functionality.
