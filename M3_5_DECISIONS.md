# DecoKit M3.5 Productization & UX Polish Decisions

**Document type:** M3.5 implementation decision record
**Scope:** M3.5 Productization & UX Polish only
**Baseline:** `f3ff1f813c95a6fe845e2b6f8b82bd28df2f0a86`
**Baseline message:** `feat: integrate DecoKit M3 calculator UI`

## 1. Milestone Position

M3.5 is an authorized transition milestone inserted between the completed M3 and the existing M4.

```text
M1 Skeleton — COMPLETE
M2 Calculator Engine — COMPLETE
M3 UI Integration — COMPLETE / FROZEN
M3.5 Productization & UX Polish — NEXT
M4 — unchanged from PRD.md and AI_HANDOFF.md
M5 — unchanged from PRD.md and AI_HANDOFF.md
```

M3.5 does not redefine M4 or M5. It does not amend `PRD.md`, `AI_HANDOFF.md`, `M2_DECISIONS.md`, or `M3_DECISIONS.md`.

## 2. Goal

Productize the existing accepted M3 UI without changing calculation semantics.

M3.5 improves how ordinary users understand and use the existing six-tool MVP. It may improve presentation, hierarchy, responsiveness, and usability. It must preserve the accepted Calculator Engine, Calculator/UI boundary, input contract, output semantics, warnings, confidence labels, errors, reset behavior, result invalidation, and sharing behavior.

## 3. Included Scope

M3.5 includes:

1. Homepage productization.
2. Shared visual foundation.
3. Six Calculator page presentation polish.
4. Result hierarchy and readability.
5. Error, warning, and confidence visual clarity.
6. Unit, label, and placeholder clarity.
7. Small-screen adaptation.
8. Touch-target and usability improvements.
9. Budget long-form usability.
10. Native WeChat interaction consistency.

Presentation changes must remain neutral and must not create new product promises, calculations, recommendations, risks, or business rules.

## 4. Explicit Exclusions

M3.5 does not include:

- new calculators;
- formula changes;
- Calculator Engine changes;
- default, loss, rounding, validation, risk, warning, or confidence semantic changes;
- UI-side business calculation;
- AI;
- network price lookup;
- merchant API or merchant backend;
- CloudBase;
- database;
- login or account systems;
- membership;
- payment;
- ads;
- monetization;
- recommendation algorithms;
- Analytics implementation;
- privacy, release, submission, or WeChat review work;
- third-party runtime dependencies;
- a custom share backend or generated share image;
- PDF or formal quotations;
- a large refactor;
- speculative architecture.

M4 and M5 retain their existing frozen definitions and are not entered during M3.5.

## 5. Immutable Boundary

The following files and ranges are immutable during M3.5:

```text
PRD.md
AI_HANDOFF.md
analytics.md
formulas.md
M2_DECISIONS.md
M3_DECISIONS.md

utils/calculators/*
tests/calculators/*

utils/calculator-ui.js
tests/ui/calculator-ui.test.js

app.js
app.json
project.config.json
sitemap.json
.gitignore
package.json

pages/tile/tile.js
pages/paint/paint.js
pages/grout/grout.js
pages/flooring/flooring.js
pages/curtain/curtain.js
pages/budget/budget.js
```

The six Calculator page JavaScript files are immutable by default. If an explicit M3.5 acceptance criterion cannot be completed through WXML and WXSS, CodeBuddy must:

```text
STOP → REPORT
```

The report must identify the criterion, explain why WXML/WXSS is insufficient, and propose the smallest page-JavaScript change. CodeBuddy may modify the relevant page JavaScript only after separate explicit authorization.

## 6. Allowed Implementation Surface

After explicit implementation authorization, M3.5 may modify by default:

```text
app.wxss

pages/index/index.wxml
pages/index/index.wxss

pages/tile/tile.wxml
pages/tile/tile.wxss
pages/paint/paint.wxml
pages/paint/paint.wxss
pages/grout/grout.wxml
pages/grout/grout.wxss
pages/flooring/flooring.wxml
pages/flooring/flooring.wxss
pages/curtain/curtain.wxml
pages/curtain/curtain.wxss
pages/budget/budget.wxml
pages/budget/budget.wxss

tests/ui/page-contracts.test.js
```

`pages/index/index.js` may receive a minimal change only when homepage presentation data genuinely requires it. The following must remain unchanged:

- tool IDs;
- page paths;
- six-tool inventory;
- navigation semantics.

`tests/ui/page-contracts.test.js` may add static M3.5 regression checks. Existing Calculator, parsing, mapping, state, reset, invalidation, and share expectations must remain intact.

M3.5 may add:

```text
tests/ui/m3-5-presentation.test.js
```

This file is justified only when an actual M3.5 presentation contract can be verified automatically. M3.5 must not add a production runtime dependency.

## 7. Calculator Engine and UI Boundary

The following rules are frozen:

- The Engine is the sole source of Calculator business logic.
- UI code must not recompute Engine-derived values.
- UI code must not use multiplication, division, `Math.ceil`, `Math.round`, new thresholds, or new conditional classifications to generate business values.
- UI code may arrange and display values already present in the raw Engine result.
- Display formatting continues to use the frozen `utils/calculator-ui.js` helper.
- The strict number parser must not change.
- Warning, error, and confidence mappings must not change.
- Raw Engine results must remain separate from display strings.
- Formatted display strings must never be passed back into a Calculator.
- Result invalidation, reset, and share semantics must remain unchanged.

Every production Calculator page must continue to explicitly import the public API:

```js
require("../../utils/calculators/index.js")
```

M3.5 must not restore Node-style directory index resolution.

## 8. Implementation Packages

M3.5 is divided into two implementation packages.

### M3.5A — Visual Foundation & Homepage

Scope:

- shared visual foundation;
- spacing;
- typography;
- touch targets;
- responsive base;
- homepage hierarchy;
- six-tool entry presentation;
- initial narrow-screen verification.

The six Calculator page JavaScript files remain unchanged.

Gate:

- all existing 109 tests pass;
- frozen-file integrity passes;
- homepage routes to all six correct pages;
- the six accepted Calculator pages have no regression;
- no horizontal overflow exists at the agreed narrow viewport;
- no DevTools or private environment file enters the implementation diff.

### M3.5B — Calculator UX, Results & Responsive Polish

Scope:

- six Calculator page WXML/WXSS files;
- form readability;
- result hierarchy;
- warning, error, and confidence presentation;
- unit and label clarity;
- Budget long-form usability;
- responsive polish;
- touch usability.

Gate:

- all existing 109 tests pass;
- any separately justified M3.5 tests pass;
- frozen-file integrity passes;
- six-page WeChat Developer Tools regression passes;
- small-screen acceptance passes;
- result invalidation passes;
- Reset passes;
- Share passes;
- WeChat Console has no application runtime or business errors.

M3.5A must pass its gate before M3.5B implementation begins.

## 9. Acceptance Criteria

M3.5 is accepted only when all applicable criteria pass:

### Integrity and automated regression

- All 109 existing tests remain PASS.
- M2 Calculator Engine remains unchanged.
- M2 Calculator tests remain unchanged.
- `utils/calculator-ui.js` remains unchanged.
- `tests/ui/calculator-ui.test.js` remains unchanged.
- Frozen documents remain unchanged.
- Six Calculator page JavaScript files remain unchanged unless separately approved.
- No formula is duplicated.
- No Engine-derived value is recomputed in UI code.
- No network, CloudBase, AI, Analytics, ads, or third-party runtime dependency is introduced.
- Every production Calculator page retains the explicit `../../utils/calculators/index.js` import.
- All production JavaScript passes `node --check`.
- `git diff --check` passes.

### Homepage and presentation

- Homepage routes to all six correct pages.
- The six-tool inventory, tool IDs, paths, and navigation semantics remain unchanged.
- Primary Engine outputs have a clear result hierarchy.
- Units remain visually associated with their input or result.
- Required, optional, and default status is not communicated by color alone.
- Warning and error states remain visually and semantically distinct.
- Confidence remains a label and is not converted into a percentage, score, or rating.
- Tile merchant comparison remains neutral.
- Grout, Curtain, and Budget warnings remain visible with successful results.

### Responsive and usability

- At a 320px-equivalent narrow viewport, there is no horizontal scroll.
- At that viewport, no critical input, result, unit, error, warning, or action is clipped.
- A normal viewport passes.
- Enlarged system text remains usable.
- Long numeric results do not break result cards.
- Touch targets remain usable and visually distinguishable.
- Budget's ten-field form remains usable while the keyboard is visible.
- Paint's conditional mode, ceiling field, and advanced section remain correct.

### Interaction regression

- Editing any Calculator input invalidates the old result.
- Reset semantics remain unchanged.
- Share semantics remain unchanged and do not include user inputs or Calculator results.
- All six tools pass WeChat Developer Tools manual regression.
- WeChat Console has no application runtime errors.

Standard existing-test command:

```text
node --test tests/calculators/*.test.js tests/ui/*.test.js
```

Expected existing baseline:

```text
M2:     73 passed
M3:     36 passed
Total:  109 passed
Failed: 0
Skipped: 0
```

## 10. CodeBuddy First-Phase Rule

CodeBuddy's first phase is strictly:

```text
READ → UNDERSTAND → REPORT
```

During this first phase, CodeBuddy must not:

- modify any file;
- create any file;
- delete any file;
- run `git add`;
- run `git commit`;
- implement M3.5A or M3.5B;
- enter M4 or M5.

CodeBuddy must first:

1. Verify the exact baseline and clean working tree.
2. Read `AI_HANDOFF.md`, `PRD.md`, `formulas.md`, `analytics.md`, `M2_DECISIONS.md`, `M3_DECISIONS.md`, `M3_HANDOFF.md`, and this record.
3. Inspect the current homepage, six pages, shared styles, UI helper, Engine public API, and tests.
4. Report the proposed M3.5A file scope, UX findings, responsive risks, immutable-boundary checks, test plan, DevTools plan, and blockers.
5. STOP and wait for human review.

Only after that preflight report passes human review may the user explicitly authorize M3.5A implementation.

## 11. Stop Conditions

CodeBuddy must stop and report if:

- the baseline commit does not match;
- the working tree contains unknown changes;
- an immutable file appears to require modification;
- a Calculator or frozen presentation semantic appears defective or ambiguous;
- a UX request requires a newly calculated business value;
- WXML/WXSS cannot meet an acceptance criterion and page JavaScript appears necessary;
- a runtime dependency, network, CloudBase, Analytics, ad, privacy, or release capability appears necessary;
- WeChat compatibility would require changing the Calculator Engine;
- tests fail or become unstable;
- DevTools rewrites tracked project configuration;
- work would enter M4, M5, or another excluded scope.

No stop condition may be resolved by silently expanding scope.
