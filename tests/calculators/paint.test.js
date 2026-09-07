const test = require("node:test");
const assert = require("node:assert/strict");

const { calculatePaint } = require("../../utils/calculators/paint");

test("paint direct mode uses frozen face and primer defaults", () => {
  const result = calculatePaint({ mode: "direct", paintAreaM2: 100 });

  assert.equal(result.ok, true);
  assert.equal(result.value.paintAreaM2, 100);
  assert.equal(result.value.coverageM2PerLPerCoat, 13);
  assert.equal(result.value.coatCount, 2);
  assert.equal(result.value.reserveRate, 0.1);
  assert.equal(result.value.facePaintLiters, 100 * 2 / 13 * 1.1);
  assert.equal(result.value.primerCoverage, 11);
  assert.equal(result.value.primerCoats, 1);
  assert.equal(result.value.primerReserveRate, 0.1);
  assert.equal(result.value.primerLiters, 100 * 1 / 11 * 1.1);
  assert.equal(result.meta.confidence, "medium_high");
});

test("paint assisted mode calculates wall area without ceiling", () => {
  const result = calculatePaint({
    mode: "assisted",
    perimeterM: 20,
    heightM: 2.5,
    openingsAreaM2: 10,
    includeCeiling: false
  });

  assert.equal(result.value.grossWallAreaM2, 50);
  assert.equal(result.value.wallNetArea, 40);
  assert.equal(result.value.paintAreaM2, 40);
});

test("paint assisted mode adds ceiling only when enabled", () => {
  const result = calculatePaint({
    mode: "assisted",
    perimeterM: 20,
    heightM: 2.5,
    openingsAreaM2: 10,
    includeCeiling: true,
    ceilingAreaM2: 20
  });

  assert.equal(result.value.grossWallAreaM2, 50);
  assert.equal(result.value.wallNetArea, 40);
  assert.equal(result.value.paintAreaM2, 60);
});

test("paint assisted mode permits zero openings", () => {
  const result = calculatePaint({
    mode: "assisted",
    perimeterM: 10,
    heightM: 3,
    openingsAreaM2: 0,
    includeCeiling: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.wallNetArea, 30);
});

test("paint rejects openings equal to or greater than gross wall area", () => {
  for (const openingsAreaM2 of [30, 31]) {
    const result = calculatePaint({
      mode: "assisted",
      perimeterM: 10,
      heightM: 3,
      openingsAreaM2,
      includeCeiling: false
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "OUT_OF_RANGE");
    assert.equal(result.error.field, "openingsAreaM2");
  }
});

test("paint accepts all frozen face parameter boundaries", () => {
  const cases = [
    { coverageM2PerLPerCoat: 10, coatCount: 1, reserveRate: 0 },
    { coverageM2PerLPerCoat: 16, coatCount: 3, reserveRate: 0.2 }
  ];

  for (const parameters of cases) {
    const result = calculatePaint({
      mode: "direct",
      paintAreaM2: 32.5,
      ...parameters
    });
    assert.equal(result.ok, true);
    assert.equal(
      result.value.facePaintLiters,
      32.5 * parameters.coatCount /
        parameters.coverageM2PerLPerCoat *
        (1 + parameters.reserveRate)
    );
  }
});

test("paint face reserve override does not alter frozen primer reserve", () => {
  const result = calculatePaint({
    mode: "direct",
    paintAreaM2: 11,
    reserveRate: 0
  });

  assert.equal(result.value.facePaintLiters, 11 * 2 / 13);
  assert.equal(result.value.primerLiters, 1.1);
  assert.equal(result.value.primerReserveRate, 0.1);
});

test("paint accepts an extremely small positive direct area", () => {
  const result = calculatePaint({ mode: "direct", paintAreaM2: 1e-12 });
  assert.equal(result.ok, true);
  assert.ok(result.value.facePaintLiters > 0);
  assert.ok(result.value.primerLiters > 0);
});

test("paint rejects invalid modes and numeric strings", () => {
  const invalidMode = calculatePaint({ mode: "auto", paintAreaM2: 10 });
  assert.equal(invalidMode.error.code, "INVALID_ENUM");

  const numericString = calculatePaint({ mode: "direct", paintAreaM2: "10" });
  assert.equal(numericString.error.code, "INVALID_NUMBER");
  assert.equal(numericString.error.field, "paintAreaM2");
});

test("paint requires a strict ceiling boolean and positive enabled ceiling area", () => {
  const base = {
    mode: "assisted",
    perimeterM: 10,
    heightM: 3,
    openingsAreaM2: 0
  };

  assert.equal(
    calculatePaint({ ...base, includeCeiling: 0 }).error.code,
    "INVALID_BOOLEAN"
  );
  assert.equal(
    calculatePaint({ ...base, includeCeiling: true }).error.field,
    "ceilingAreaM2"
  );
  assert.equal(
    calculatePaint({ ...base, includeCeiling: true, ceilingAreaM2: 0 }).error.code,
    "OUT_OF_RANGE"
  );
});

test("paint direct mode does not use assisted fields", () => {
  const result = calculatePaint({
    mode: "direct",
    paintAreaM2: 10,
    perimeterM: "invalid",
    includeCeiling: "invalid"
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.paintAreaM2, 10);
});

test("paint rejects out-of-range face parameters", () => {
  for (const [field, value] of [
    ["coverageM2PerLPerCoat", 9],
    ["coverageM2PerLPerCoat", 17],
    ["coatCount", 0],
    ["coatCount", 4],
    ["reserveRate", -0.01],
    ["reserveRate", 0.21]
  ]) {
    const result = calculatePaint({
      mode: "direct",
      paintAreaM2: 10,
      [field]: value
    });
    assert.equal(result.error.code, "OUT_OF_RANGE", `${field}=${value}`);
  }
});

test("paint rejects zero, negative, and non-finite direct areas", () => {
  for (const paintAreaM2 of [
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ]) {
    const result = calculatePaint({ mode: "direct", paintAreaM2 });
    assert.equal(result.ok, false, String(paintAreaM2));
    assert.equal(result.error.field, "paintAreaM2");
  }
});

test("paint returns calculation range error for finite input overflow", () => {
  const result = calculatePaint({
    mode: "direct",
    paintAreaM2: Number.MAX_VALUE,
    coatCount: 3,
    coverageM2PerLPerCoat: 10,
    reserveRate: 0.2
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CALCULATION_RANGE");
  assert.equal(result.error.field, "facePaintLiters");
});
