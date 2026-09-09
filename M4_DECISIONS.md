# DecoKit M4 Minimum Analytics — Frozen Decisions

Status: FROZEN

## 1. Status and precedence

- This document freezes the approved **M4 Minimum Analytics** decisions.
- Authorized baseline: `9ce0e9082d912fdb00f93abb71b7a83ca62c9bd5` (feat: complete DecoKit M3.5B calculator UX polish).
- For M4 implementation, **M4_DECISIONS.md supersedes `analytics.md` ONLY** for:
  - analytics event scope
  - analytics event naming
  - analytics payload schema
  - analytics implementation exclusions
- `analytics.md` remains unchanged as historical frozen MVP planning documentation.
- This document does **not** supersede `formulas.md`, PRD calculator semantics, M2/M3/M3.5 behavior, or any unrelated historical decision.

## 2. M4 objective

Implement the smallest, safest analytics surface for DecoKit v1: a single custom product event that records, per successful calculation, **which calculator** was used — with no calculator input or result values.

## 3. Explicit scope / exclusions

M4 = Minimum Analytics only.

Explicitly **OUT** of M4 / v1 release scope:

- Ads
- ad placeholders
- ad unit IDs
- CloudBase
- `wx.cloud`
- cloud functions
- database
- login
- OpenID
- UnionID
- user profile
- payment
- remote pricing
- AI
- external analytics SDKs
- custom user IDs
- device IDs
- session IDs
- analytics persistence
- retry queues
- offline queues
- batching

CloudBase is **NOT** a mandatory later milestone. It may only be reconsidered if a future real product requirement creates a server-side need.

## 4. Custom event contract

Exactly one custom event is authorized:

```
calculation_success
```

NOT authorized for M4 (and must not be implemented or planned under M4):

- `calculator_open`
- `share`
- `calculation_attempt`
- `calculation_failed`
- `validation_error`
- `calculate_error`
- `tool_view`
- `app_open`
- `home_view`
- `result_share`
- `ad_impression`
- any other custom event

Page/open/share usage should rely on native WeChat platform statistics unless a later explicit decision changes this.

## 5. calculation_success semantics

Exact definition:

> One `calculation_success` event is **attempted** each time the user triggers the existing `calculate()` flow and the local calculator flow completes successfully, `formatResult()` completes successfully, and the successful result state has been submitted through `setData()` with `hasCalculated:true`.

Precision:

- This must **NOT** be described as "the user has definitely seen the rendered result" nor as "the UI rendering callback has completed".
- No `setData` callback is required for M4 analytics.

Examples:

- successful calculate → 1 event attempt
- successful recalculate after input change → 1 new event attempt
- reset then successful calculate → 1 event attempt
- validation failure → 0 events
- Engine returns normal failure result (`result.ok === false`) → 0 events
- `formatResult` throws → 0 events
- analytics fails → calculation remains successful

No deduplication is added.

## 6. Calculator identifiers

Allowed `calculator` values (frozen):

```
tile
paint
grout
flooring
curtain
budget
```

These match the canonical page route keys in `app.json` and the historical `tool_id` suggestions in `analytics.md` §6. Identifier source for implementation: a per-page literal constant validated against a frozen six-key set inside the helper. NOT derived from user-visible labels (e.g. "装修计算工具 · 乳胶漆用量"). NOT coupled to engine imports.

## 7. Payload and data-minimization rules

Frozen payload — exactly:

```json
{
  "calculator": "<calculator key>"
}
```

No second business property is allowed.

Explicitly forbidden payload data (non-exhaustive):

- `form`
- `displayResult`
- `warnings`
- `confidence`
- `fieldErrors`
- `rawError`
- `mode`
- dimensions / area / room size / tile size / loss rate / laying mode
- coverage / coat count / reserve percent
- wall/ceiling dimensions / grout dimensions / curtain dimensions
- fullness / panel count
- Budget ten component values / `totalBudget`
- any calculated quantity
- any user-entered value
- any calculator result value
- any account/user/device/session identifier

Budget-specific freeze:

- M4 may know: `calculation_success` + `calculator=budget`
- M4 must NOT know: any of the ten Budget amount values, nor `totalBudget`

## 8. analytics.md precedence resolution

`analytics.md` (historical FROZEN MVP) defines:

```
event:    calculate
properties: tool_id, mode
```

M4 supersedes those analytics **implementation** definitions with:

```
event:      calculation_success
property:   calculator
```

No `mode` property.

`analytics.md` is **not modified**. For M4 implementation, M4_DECISIONS.md supersedes `analytics.md` for custom analytics event scope, naming, payload schema, and implementation exclusions. `analytics.md` remains unchanged as historical frozen MVP planning documentation.

## 9. Implementation architecture

Frozen flow:

```
Page calculate() success path
        ↓
successful setData(...)
        ↓
reportCalculationSuccess(CALCULATOR_KEY)
        ↓
minimal shared analytics helper
        ↓
wx.reportEvent("calculation_success", { calculator })
```

Helper location (frozen):

```
utils/analytics.js
```

Public helper surface:

```js
reportCalculationSuccess(calculatorKey)
```

This must remain a **minimal helper, not a framework**.

The helper owns:

1. allowed calculator-key validation
2. `wx.reportEvent` runtime availability check
3. exact payload construction
4. synchronous failure isolation

Pages must **NOT** directly construct analytics payloads.
Pages must **NOT** call `wx.reportEvent` directly.

## 10. Failure-isolation contract

Analytics is **BEST-EFFORT ONLY**.

Required behavior:

- if `wx.reportEvent` does not exist → no-op
- if `wx.reportEvent` throws synchronously → swallow inside the analytics helper
- invalid/missing platform event configuration → must not block calculator
- network/platform analytics failure → must not block calculator
- helper returns no business result consumed by the calculator flow
- `calculate()` never awaits analytics
- analytics exception must never propagate into calculator logic

Core contract:

> ANALYTICS FAILURE MUST NEVER CONVERT A SUCCESSFUL CALCULATION INTO FAILURE.

## 11. wx.reportEvent compatibility

New analytics implementation is frozen around:

```js
wx.reportEvent(...)
```

NOT implemented:

```js
wx.reportAnalytics(...)   // legacy / deprecated
```

Runtime availability must be guarded:

```js
typeof wx.reportEvent === "function"
```

Repository implementation and WeChat platform configuration are **separate gates**.

Repository code must remain safe when:

- the project still uses `touristappid`
- the real backend event is not configured
- DevTools cannot actually upload the event
- event configuration is incomplete

## 12. Local-only / outbound-data boundary

After M4, freeze these architecture statements:

TRUE:

- calculator inputs are processed locally
- calculator results are produced locally
- calculator results do not depend on a remote server
- calculator input values are not uploaded by M4 analytics
- calculator result values are not uploaded by M4 analytics
- Budget input/result values remain local-only

NO LONGER TRUE after M4 implementation:

- "the app makes no outbound data transmissions"

Reason: `calculation_success` sends the calculator category to the WeChat analytics backend.

This section is architecture analysis only — not final legal/privacy copy. M5 owns final privacy/release wording.

## 13. Authorized implementation file scope

Expected modified/new files for implementation (frozen anticipation, not performed here):

MODIFY:

- `pages/tile/tile.js`
- `pages/paint/paint.js`
- `pages/grout/grout.js`
- `pages/flooring/flooring.js`
- `pages/curtain/curtain.js`
- `pages/budget/budget.js`

NEW:

- `utils/analytics.js`
- `tests/analytics/analytics.test.js`

MAY EXTEND:

- `tests/calculators/contract.test.js`

No other production file is authorized without a new decision.

## 14. Immutable boundaries

M4 implementation must NOT change:

- `utils/calculators/*`
- `utils/calculator-ui.js`
- `formulas.md`
- all WXML
- all WXSS
- `app.wxss`
- all page JSON
- `app.js`
- `app.json`
- `project.config.json`
- `package.json`
- PRD calculator semantics
- M2 decisions
- M3 decisions
- M3.5 decisions
- existing warning mappings
- confidence mappings
- formulas / defaults / loss rates / rounding
- field inventories / result hierarchy

Prior tests must not be modified except the specifically authorized contract-test extension (for M4 static guards).

## 15. Automated test contract

Minimum strong M4 test contract to freeze:

- **T1** Event name exactly `calculation_success`.
- **T2** Payload deep-equals exactly `{ calculator: key }`; no extra business keys.
- **T3** Only the six allowed calculator values are accepted; an invalid calculator key → no `wx.reportEvent` call.
- **T4** If `wx.reportEvent` is unavailable → `reportCalculationSuccess` does not throw. If `wx.reportEvent` throws → `reportCalculationSuccess` does not throw.
- **T5** Each of the six pages: successful `calculate()` → exactly one reporting attempt; validation failure → zero reporting attempts.
- **T6** Static architecture guards:
  - `wx.reportEvent` direct usage allowed only inside `utils/analytics.js`
  - `wx.reportAnalytics` forbidden everywhere
  - `utils/calculators/*` must not import/use analytics
  - `utils/calculator-ui.js` must not import/use analytics

Tests should also indirectly enforce that calculator input/result values are not included in the analytics payload. Avoid unnecessary network/platform integration tests.

## 16. Repository vs platform gates

Two independent gates:

**GATE A — Repository Implementation** (completable/testable locally):

- analytics helper
- six success hooks
- payload
- guards
- automated tests
- architectural boundaries

**GATE B — Real WeChat Platform Verification** (requires real AppID / current WeChat backend):

- configure `calculation_success` event
- configure `calculator` parameter
- verify actual event upload
- verify analytics dashboard receipt
- verify real platform behavior
- verify current privacy/review requirements

Failure of Gate B must NOT make calculator functionality fail. An M4 implementation commit may be technically complete before Gate B, but release readiness must record Gate B status.

## 17. Completion criteria

M4 repository implementation is complete only when:

- `calculation_success` is the only custom event
- helper is minimal and isolated
- six pages emit after successful `setData()`
- no calculator data values are included
- invalid keys are blocked
- analytics errors never affect calculation
- all required M4 tests pass
- all prior M2/M3/M3.5 tests remain green
- no forbidden files changed
- no Ads
- no CloudBase
- no login
- no extra analytics scope
- repository remains clean after commit

M4 does **NOT** require monetization or backend infrastructure.

## 18. Deferred items

- All `analytics.md` events other than `calculation_success` (e.g. `calculate`, `calculate_error`, `tool_view`, `result_share`, `ad_impression`) — deferred; not part of M4.
- Ads / CloudBase / login / payment / remote pricing / AI — explicitly deferred / out of v1.
- Gate B platform verification — deferred to real AppID availability.
- Final privacy/release wording — owned by M5.

## 19. Non-goals

- Not a general analytics framework (no queue, batching, persistence, user ID, retry, registry, plugin, SDK wrapper, class abstraction).
- Not a redesign of existing calculator error semantics.
- Not an addition of generic calculator `try/catch` as part of analytics work (the only new failure isolation authorized in M4 is for analytics itself).
- Not a change to formulas, defaults, loss rates, rounding, field inventories, result hierarchy, warning/confidence mappings.
- Not a modification of any prior frozen document.

---

Frozen by: M4 Decision Freeze Documentation Package
Baseline: 9ce0e9082d912fdb00f93abb71b7a83ca62c9bd5
