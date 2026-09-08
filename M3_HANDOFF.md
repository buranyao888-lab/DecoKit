# DecoKit M3 Handoff

**Document type:** Codex → CodeBuddy transition artifact
**M3 status:** COMPLETE / FROZEN
**M3 baseline commit:** `f3ff1f813c95a6fe845e2b6f8b82bd28df2f0a86`
**M3 baseline message:** `feat: integrate DecoKit M3 calculator UI`

## 1. Purpose

This document records the accepted M1–M3 state and the boundaries that protect it during the CodeBuddy handoff. It does not define or change Calculator formulas, defaults, validation, warnings, confidence, rounding, or risk semantics.

The next authorized milestone is:

`M3.5 — Productization & UX Polish`

M3.5 is an inserted transition milestone between M3 and the existing M4. The definitions of M4 and M5 in `PRD.md` and `AI_HANDOFF.md` remain unchanged.

## 2. Accepted Git History

```text
f3ff1f8 feat: integrate DecoKit M3 calculator UI
af75271 docs: freeze M3 UI integration decisions
7246316 feat: implement DecoKit M2 calculator engine
c2853a3 docs: freeze M2 calculator implementation decisions
9d6c8a4 feat: establish DecoKit MVP skeleton
275a73b chore: establish DecoKit frozen project baseline
```

Accepted milestones:

- M1 Skeleton — COMPLETE
- M2 Calculator Engine — COMPLETE
- M3 UI Integration — COMPLETE / FROZEN
- M3.5 Productization & UX Polish — NEXT
- M4 — retains the frozen Analytics / Ads / CloudBase-related definition
- M5 — retains the frozen Privacy / Release / WeChat Review definition

## 3. M3 Delivered Scope

M3 integrates the six accepted tool pages with the committed M2 Calculator Engine:

- Tile
- Paint
- Grout
- Flooring
- Curtain
- Budget

Each page provides the accepted local interaction:

```text
input
→ strict presentation-boundary parsing
→ public Calculator Engine call
→ result or structured error
→ warning and confidence presentation
→ edit, recalculate, reset, and native share
```

M3 also provides:

- a shared strict UI parser and presentation helper at `utils/calculator-ui.js`;
- raw Calculator results kept separately from display strings;
- field-level and page-level error presentation;
- result invalidation after an input change;
- reset behavior that restores the frozen UI defaults without calculating;
- neutral native share titles and paths without user inputs or calculated values;
- the frozen Tile merchant comparison presentation;
- the frozen Grout, Curtain, and Budget warnings.

M3 did not add CloudBase, Analytics, ads, AI, login, payment, database, network pricing, a merchant backend, or release functionality.

## 4. Acceptance Evidence

### Automated tests

```text
M2 Calculator tests: 73/73 PASS
M3 UI tests:         36/36 PASS
Total:              109/109 PASS
Failed:             0
Skipped:            0
```

Standard command:

```text
node --test tests/calculators/*.test.js tests/ui/*.test.js
```

### WeChat DevTools manual acceptance

```text
Tile      PASS
Paint     PASS
Grout     PASS
Flooring  PASS
Curtain   PASS
Budget    PASS
```

The six pages were accepted in a real WeChat Developer Tools environment using base library 3.17.2.

## 5. WeChat Module Resolution Compatibility

During M3 manual acceptance, WeChat Developer Tools reported:

```text
module 'utils/calculators.js' is not defined,
require args is '../../utils/calculators'
```

The runtime did not reliably resolve a directory-level CommonJS import to `utils/calculators/index.js`.

The accepted compatibility resolution is that every production Calculator page explicitly imports the public entry:

```js
require("../../utils/calculators/index.js")
```

Future work must not restore the directory-level form:

```js
require("../../utils/calculators")
```

The compatibility fix changed only module resolution paths. It did not change Calculator formulas, business logic, defaults, validation, warnings, confidence, UI decisions, or test result expectations.

## 6. Current Architecture

```text
app.js / app.json / app.wxss

pages/
  index/
  tile/
  paint/
  grout/
  flooring/
  curtain/
  budget/

utils/
  calculator-ui.js
  calculators/
    index.js
    defaults.js
    validation.js
    units.js
    tile.js
    paint.js
    grout.js
    flooring.js
    curtain.js
    budget.js

tests/
  calculators/
  ui/
```

Architecture rules:

- `utils/calculators/index.js` is the public Calculator API.
- `utils/calculators/*` owns all Calculator business logic.
- `utils/calculator-ui.js` owns only strict parsing and presentation mapping/formatting.
- Each page explicitly constructs its Calculator input and calls one public Calculator function.
- WXML and WXSS present page state; they do not calculate business values.
- Calculator execution remains local, deterministic, network-independent, and UI-independent.

## 7. Frozen Files and Engine Integrity

The following authoritative documents remain unchanged at the accepted M3 baseline:

```text
PRD.md
AI_HANDOFF.md
formulas.md
analytics.md
M2_DECISIONS.md
M3_DECISIONS.md
```

The M2 Engine and its regression suite remain unchanged:

```text
utils/calculators/*
tests/calculators/*
```

`formulas.md` remains the sole source of Calculator business formulas and parameters. CodeBuddy must treat the M2 Engine as a read-only dependency unless a separately authorized defect process explicitly permits a minimal change.

## 8. DevTools Local-File Behavior

WeChat Developer Tools may locally rewrite:

```text
project.config.json
```

It may also generate:

```text
project.private.config.json
.DS_Store
```

Handoff rules:

- `project.config.json` must not be committed when it only contains local DevTools changes.
- `project.private.config.json` must not be committed.
- `.DS_Store` must not be committed.
- `project.private.config.json` and `.DS_Store` are already ignored.
- Never delete or overwrite local DevTools configuration merely to make the tree appear clean; classify it first and exclude it from product commits.

## 9. Next Milestone Boundary

The next authorized milestone is M3.5 Productization & UX Polish, governed by `M3_5_DECISIONS.md`.

M3.5 may improve presentation, hierarchy, responsive behavior, touch usability, and product clarity. It must not change calculation semantics or absorb the frozen M4/M5 work.

CodeBuddy's first M3.5 phase is read-only:

```text
READ → UNDERSTAND → REPORT
```

Implementation requires separate explicit authorization after the preflight report is reviewed.
