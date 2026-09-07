const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateTile,
  MERCHANT_DIFFERENCE_BANDS
} = require("../../utils/calculators/tile");

const BASE_INPUT = Object.freeze({
  areaM2: 10,
  tileLengthMm: 600,
  tileWidthMm: 600,
  layingMode: "straight"
});

test("tile follows the frozen formula for standard input", () => {
  const result = calculateTile(BASE_INPUT);

  assert.equal(result.ok, true);
  assert.equal(result.value.tileAreaM2, 0.36);
  assert.equal(result.value.theoreticalPieces, 28);
  assert.equal(result.value.lossRate, 0.05);
  assert.equal(result.value.recommendedPieces, 30);
  assert.equal(result.value.boxes, null);
  assert.equal(result.meta.confidence, "high");
});

test("tile uses all three frozen waste presets", () => {
  const expected = {
    straight: { lossRate: 0.05, recommendedPieces: 30 },
    staggered: { lossRate: 0.08, recommendedPieces: 31 },
    complex: { lossRate: 0.1, recommendedPieces: 31 }
  };

  for (const [layingMode, values] of Object.entries(expected)) {
    const result = calculateTile({ ...BASE_INPUT, layingMode });
    assert.equal(result.value.lossRate, values.lossRate);
    assert.equal(result.value.recommendedPieces, values.recommendedPieces);
  }
});

test("tile accepts decimal input and rounds theoretical pieces upward", () => {
  const result = calculateTile({
    areaM2: 1.01,
    tileLengthMm: 1000,
    tileWidthMm: 1000,
    layingMode: "straight"
  });

  assert.equal(result.value.theoreticalPieces, 2);
  assert.equal(result.value.recommendedPieces, 3);
});

test("tile accepts an extremely small positive area", () => {
  const result = calculateTile({
    areaM2: 1e-12,
    tileLengthMm: 1000,
    tileWidthMm: 1000,
    layingMode: "straight"
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.theoreticalPieces, 1);
});

test("tile preserves an exact complex-waste ceil boundary", () => {
  const result = calculateTile({
    areaM2: 110,
    tileLengthMm: 1000,
    tileWidthMm: 1000,
    layingMode: "complex"
  });

  assert.equal(result.value.theoreticalPieces, 110);
  assert.equal(result.value.recommendedPieces, 121);
});

test("tile calculates optional boxes at exact and upward ceil boundaries", () => {
  const exact = calculateTile({ ...BASE_INPUT, piecesPerBox: 10 });
  const upward = calculateTile({ ...BASE_INPUT, piecesPerBox: 8 });
  assert.equal(exact.value.recommendedPieces, 30);
  assert.equal(exact.value.boxes, 3);
  assert.equal(upward.value.boxes, 4);
});

test("tile keeps boxes null when box size is omitted", () => {
  assert.equal(calculateTile(BASE_INPUT).value.boxes, null);
});

test("tile classifies merchant comparison at frozen boundaries", () => {
  const input = {
    areaM2: 95,
    tileLengthMm: 1000,
    tileWidthMm: 1000,
    layingMode: "straight"
  };
  const recommended = calculateTile(input).value.recommendedPieces;
  assert.equal(recommended, 100);

  const cases = [
    [recommended + 5, MERCHANT_DIFFERENCE_BANDS.NORMAL_REFERENCE_RANGE],
    [recommended + 10, MERCHANT_DIFFERENCE_BANDS.SLIGHTLY_HIGH],
    [recommended + 20, MERCHANT_DIFFERENCE_BANDS.SIGNIFICANTLY_HIGH],
    [recommended + 21, MERCHANT_DIFFERENCE_BANDS.LARGE_DIFFERENCE],
    [recommended - 50, MERCHANT_DIFFERENCE_BANDS.NORMAL_REFERENCE_RANGE]
  ];

  for (const [merchantPieces, band] of cases) {
    const result = calculateTile({ ...input, merchantPieces });
    assert.equal(result.value.merchantDifferenceBand, band);
  }
});

test("tile rejects an unsupported laying mode", () => {
  const result = calculateTile({ ...BASE_INPUT, layingMode: "special" });
  assert.deepEqual(result.error.code, "INVALID_ENUM");
  assert.equal(result.error.field, "layingMode");
});

test("tile rejects invalid required and optional numbers", () => {
  for (const [field, value] of [
    ["areaM2", 0],
    ["tileLengthMm", -1],
    ["tileWidthMm", "600"],
    ["areaM2", Number.NaN],
    ["areaM2", Number.POSITIVE_INFINITY],
    ["piecesPerBox", 0],
    ["merchantPieces", false]
  ]) {
    const result = calculateTile({ ...BASE_INPUT, [field]: value });
    assert.equal(result.ok, false, `${field}=${String(value)}`);
  }
});

test("tile returns a calculation range error for finite input overflow", () => {
  const result = calculateTile({
    areaM2: 1,
    tileLengthMm: Number.MAX_VALUE,
    tileWidthMm: Number.MAX_VALUE,
    layingMode: "straight"
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CALCULATION_RANGE");
  assert.equal(result.error.field, "tileAreaM2");
});
