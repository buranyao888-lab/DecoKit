const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateBudget } = require("../../utils/calculators/budget");

const BASE_INPUT = Object.freeze({
  baseConstruction: 1,
  plumbingElectrical: 2,
  masonry: 3,
  carpentry: 4,
  painting: 5,
  mainMaterials: 6,
  customization: 7,
  kitchenBathroom: 8,
  installation: 9,
  contingency: 10
});

test("budget sums all ten frozen components", () => {
  const result = calculateBudget(BASE_INPUT);
  assert.equal(result.ok, true);
  assert.equal(result.value.totalBudget, 55);
});

test("budget permits zero-valued components", () => {
  const input = Object.fromEntries(Object.keys(BASE_INPUT).map(field => [field, 0]));
  const result = calculateBudget(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.totalBudget, 0);
});

test("budget preserves JavaScript number precision for decimal amounts", () => {
  const result = calculateBudget({
    ...BASE_INPUT,
    baseConstruction: 0.1,
    plumbingElectrical: 0.2
  });
  assert.equal(result.value.totalBudget, 0.1 + 0.2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10);
  assert.equal(typeof result.value.totalBudget, "number");
});

test("budget returns the frozen missing-component semantic", () => {
  const input = { ...BASE_INPUT };
  delete input.carpentry;

  const result = calculateBudget(input);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MISSING_BUDGET_COMPONENT");
  assert.equal(result.error.field, "carpentry");
});

test("budget rejects negative and non-finite component amounts", () => {
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = calculateBudget({ ...BASE_INPUT, painting: value });
    assert.equal(result.ok, false);
    assert.equal(result.error.field, "painting");
  }
});

test("budget rejects numeric strings", () => {
  const result = calculateBudget({ ...BASE_INPUT, mainMaterials: "6" });
  assert.equal(result.error.code, "INVALID_NUMBER");
  assert.equal(result.error.field, "mainMaterials");
});

test("budget passes optional metadata through without using it", () => {
  const metadata = {
    version: "budget_config_v1",
    city: "example",
    level: "standard",
    updated_at: "2026-01-01",
    source: "maintained-config"
  };
  const result = calculateBudget({ ...BASE_INPUT, ...metadata });

  assert.equal(result.value.totalBudget, 55);
  assert.deepEqual(result.meta.metadata, metadata);
});

test("budget returns rough confidence and quotation warning", () => {
  const result = calculateBudget(BASE_INPUT);
  assert.equal(result.meta.confidence, "rough");
  assert.deepEqual(result.meta.warnings, [
    { code: "BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION" }
  ]);
});

test("budget has no system-time dependency", () => {
  const originalNow = Date.now;
  Date.now = () => {
    throw new Error("system time must not be read");
  };

  try {
    const result = calculateBudget({
      ...BASE_INPUT,
      updated_at: "1900-01-01"
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.totalBudget, 55);
  } finally {
    Date.now = originalNow;
  }
});

test("budget rejects a non-finite calculated total", () => {
  const result = calculateBudget({
    ...BASE_INPUT,
    baseConstruction: Number.MAX_VALUE,
    plumbingElectrical: Number.MAX_VALUE
  });
  assert.equal(result.error.code, "CALCULATION_RANGE");
  assert.equal(result.error.field, "totalBudget");
});
