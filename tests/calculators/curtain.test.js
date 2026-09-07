const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateCurtain } = require("../../utils/calculators/curtain");

test("curtain uses frozen fullness and panel defaults", () => {
  const result = calculateCurtain({ trackWidthM: 3 });

  assert.equal(result.ok, true);
  assert.equal(result.value.fullness, 1.8);
  assert.equal(result.value.panels, 2);
  assert.equal(result.value.totalFinishedWidthM, 3 * 1.8);
  assert.equal(result.value.singlePanelWidthM, 3 * 1.8 / 2);
  assert.equal(result.meta.confidence, "medium_high");
});

test("curtain supports every frozen fullness option", () => {
  for (const fullness of [1.5, 1.8, 2]) {
    const result = calculateCurtain({ trackWidthM: 2.5, fullness });
    assert.equal(result.ok, true);
    assert.equal(result.value.totalFinishedWidthM, 2.5 * fullness);
  }
});

test("curtain supports one or two panels", () => {
  for (const panels of [1, 2]) {
    const result = calculateCurtain({
      trackWidthM: 2.4,
      fullness: 2,
      panels
    });
    assert.equal(result.value.singlePanelWidthM, 2.4 * 2 / panels);
  }
});

test("curtain accepts decimal track width without display rounding", () => {
  const result = calculateCurtain({ trackWidthM: 1.234, fullness: 1.5 });
  assert.equal(result.value.totalFinishedWidthM, 1.234 * 1.5);
});

test("curtain accepts an extremely small positive track width", () => {
  const result = calculateCurtain({ trackWidthM: 1e-12 });
  assert.equal(result.ok, true);
  assert.equal(result.value.totalFinishedWidthM, 1e-12 * 1.8);
});

test("curtain rejects invalid fullness", () => {
  for (const fullness of [1.6, "1.8", Number.NaN]) {
    const result = calculateCurtain({ trackWidthM: 2, fullness });
    assert.equal(result.ok, false);
    assert.equal(result.error.field, "fullness");
  }
});

test("curtain rejects invalid panels", () => {
  for (const panels of [0, 3, "2", false]) {
    const result = calculateCurtain({ trackWidthM: 2, panels });
    assert.equal(result.ok, false);
    assert.equal(result.error.field, "panels");
  }
});

test("curtain returns the frozen height measurement warning and no height", () => {
  const result = calculateCurtain({ trackWidthM: 2, curtainHeightM: 3 });

  assert.deepEqual(result.meta.warnings, [
    { code: "CURTAIN_HEIGHT_MEASUREMENT_REQUIRED" }
  ]);
  assert.equal(Object.hasOwn(result.value, "height"), false);
  assert.equal(Object.hasOwn(result.value, "curtainHeightM"), false);
});

test("curtain rejects invalid track widths and finite overflow", () => {
  for (const trackWidthM of [0, -1, "2", Number.POSITIVE_INFINITY]) {
    assert.equal(calculateCurtain({ trackWidthM }).ok, false);
  }

  const overflow = calculateCurtain({ trackWidthM: Number.MAX_VALUE, fullness: 2 });
  assert.equal(overflow.error.code, "CALCULATION_RANGE");
  assert.equal(overflow.error.field, "totalFinishedWidthM");
});
