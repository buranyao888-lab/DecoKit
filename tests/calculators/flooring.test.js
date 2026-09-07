const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateFlooring } = require("../../utils/calculators/flooring");

const BASE_INPUT = Object.freeze({
  netAreaM2: 100,
  layingMode: "straight",
  irregularRoom: false
});

test("flooring uses all three frozen waste presets", () => {
  const cases = [
    ["straight", 0.05, 105],
    ["staggered", 0.08, 108],
    ["herringbone", 0.15, 114.99999999999999]
  ];

  for (const [layingMode, lossRate, purchaseAreaM2] of cases) {
    const result = calculateFlooring({ ...BASE_INPUT, layingMode });
    assert.equal(result.ok, true);
    assert.equal(result.value.lossRate, lossRate);
    assert.equal(result.value.purchaseAreaM2, purchaseAreaM2);
  }
});

test("flooring adds two percentage points for an irregular room", () => {
  const result = calculateFlooring({
    netAreaM2: 100,
    layingMode: "staggered",
    irregularRoom: true
  });

  assert.equal(result.value.presetLossRate, 0.08);
  assert.equal(result.value.lossRate, 0.1);
  assert.equal(result.value.purchaseAreaM2, 110.00000000000001);
});

test("flooring retains the frozen twenty-percent automatic ceiling", () => {
  for (const layingMode of ["straight", "staggered", "herringbone"]) {
    const result = calculateFlooring({
      ...BASE_INPUT,
      layingMode,
      irregularRoom: true
    });
    assert.ok(result.value.lossRate <= 0.2);
  }
});

test("flooring supports decimal area without display rounding", () => {
  const result = calculateFlooring({
    netAreaM2: 12.34,
    layingMode: "straight",
    irregularRoom: false
  });
  assert.equal(result.value.purchaseAreaM2, 12.34 * 1.05);
});

test("flooring accepts an extremely small positive area", () => {
  const result = calculateFlooring({
    netAreaM2: 1e-12,
    layingMode: "straight",
    irregularRoom: false
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.purchaseAreaM2, 1e-12 * 1.05);
});

test("flooring calculates boxes at exact and upward ceil boundaries", () => {
  const exact = calculateFlooring({ ...BASE_INPUT, boxCoverageM2: 21 });
  const upward = calculateFlooring({ ...BASE_INPUT, boxCoverageM2: 24 });
  assert.equal(exact.value.purchaseAreaM2, 105);
  assert.equal(exact.value.boxes, 5);
  assert.equal(upward.value.boxes, 5);
});

test("flooring keeps boxes null when box coverage is omitted", () => {
  assert.equal(calculateFlooring(BASE_INPUT).value.boxes, null);
});

test("flooring rejects unsupported laying modes", () => {
  const result = calculateFlooring({ ...BASE_INPUT, layingMode: "custom" });
  assert.equal(result.error.code, "INVALID_ENUM");
  assert.equal(result.error.field, "layingMode");
});

test("flooring requires a strict irregular-room boolean", () => {
  for (const value of [0, 1, "false", null]) {
    const result = calculateFlooring({ ...BASE_INPUT, irregularRoom: value });
    assert.equal(result.error.code, "INVALID_BOOLEAN");
  }
});

test("flooring rejects invalid numeric inputs", () => {
  for (const [field, value] of [
    ["netAreaM2", 0],
    ["netAreaM2", -1],
    ["netAreaM2", "100"],
    ["netAreaM2", Number.NaN],
    ["boxCoverageM2", 0],
    ["boxCoverageM2", Number.POSITIVE_INFINITY]
  ]) {
    const result = calculateFlooring({ ...BASE_INPUT, [field]: value });
    assert.equal(result.ok, false, `${field}=${String(value)}`);
  }
});

test("flooring returns calculation range error for finite overflow", () => {
  const result = calculateFlooring({
    netAreaM2: Number.MAX_VALUE,
    layingMode: "herringbone",
    irregularRoom: true
  });
  assert.equal(result.error.code, "CALCULATION_RANGE");
  assert.equal(result.error.field, "purchaseAreaM2");
});
