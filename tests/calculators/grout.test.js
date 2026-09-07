const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateGrout } = require("../../utils/calculators/grout");

const BASE_INPUT = Object.freeze({
  areaM2: 10,
  tileLengthMm: 600,
  tileWidthMm: 600,
  jointWidthMm: 2
});

test("grout follows the frozen theoretical-volume formula", () => {
  const result = calculateGrout(BASE_INPUT);

  const tileLengthM = 600 / 1000;
  const tileWidthM = 600 / 1000;
  const jointWidthM = 2 / 1000;
  const jointDepthM = 3 / 1000;
  const jointLengthPerM2 =
    (tileLengthM + tileWidthM) / (tileLengthM * tileWidthM);
  const totalJointLengthM = 10 * jointLengthPerM2;
  const volumeM3 = totalJointLengthM * jointWidthM * jointDepthM;

  assert.equal(result.ok, true);
  assert.equal(result.value.tileLengthM, tileLengthM);
  assert.equal(result.value.tileWidthM, tileWidthM);
  assert.equal(result.value.jointWidthM, jointWidthM);
  assert.equal(result.value.jointDepthM, jointDepthM);
  assert.equal(result.value.jointLengthPerM2, jointLengthPerM2);
  assert.equal(result.value.totalJointLengthM, totalJointLengthM);
  assert.equal(result.value.volumeM3, volumeM3);
  assert.equal(result.value.volumeMl, volumeM3 * 1_000_000);
});

test("grout defaults joint depth to 3mm", () => {
  const result = calculateGrout(BASE_INPUT);
  assert.equal(result.value.jointDepthM, 0.003);
});

test("grout accepts a custom positive joint depth", () => {
  const result = calculateGrout({ ...BASE_INPUT, jointDepthMm: 4.5 });
  assert.equal(result.ok, true);
  assert.equal(result.value.jointDepthM, 0.0045);
  assert.equal(
    result.value.volumeM3,
    result.value.totalJointLengthM * result.value.jointWidthM * 0.0045
  );
});

test("grout converts cubic metres to millilitres", () => {
  const result = calculateGrout(BASE_INPUT);
  assert.equal(result.value.volumeMl, result.value.volumeM3 * 1_000_000);
});

test("grout returns reference confidence and warning", () => {
  const result = calculateGrout(BASE_INPUT);
  assert.equal(result.meta.confidence, "reference");
  assert.deepEqual(result.meta.warnings, [{ code: "GROUT_REFERENCE_ONLY" }]);
});

test("grout never returns a cartridge recommendation", () => {
  const result = calculateGrout({
    ...BASE_INPUT,
    cartridgeEffectiveVolumeMl: 400,
    effectiveYieldFactor: 0.8
  });

  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.value, "cartridges"), false);
  assert.equal(Object.hasOwn(result.value, "recommendedCartridges"), false);
});

test("grout accepts decimal dimensions and area", () => {
  const result = calculateGrout({
    areaM2: 0.25,
    tileLengthMm: 299.5,
    tileWidthMm: 599.5,
    jointWidthMm: 1.5,
    jointDepthMm: 2.5
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.tileLengthM, 0.2995);
  assert.equal(result.value.jointWidthM, 0.0015);
});

test("grout accepts extremely small positive inputs when outputs remain finite", () => {
  const result = calculateGrout({
    areaM2: 1e-9,
    tileLengthMm: 1,
    tileWidthMm: 1,
    jointWidthMm: 0.1,
    jointDepthMm: 0.1
  });
  assert.equal(result.ok, true);
  assert.ok(result.value.volumeMl > 0);
});

test("grout rejects zero, negative, non-number, and non-finite inputs", () => {
  for (const [field, value] of [
    ["areaM2", 0],
    ["tileLengthMm", -1],
    ["tileWidthMm", "600"],
    ["jointWidthMm", Number.NaN],
    ["jointDepthMm", Number.POSITIVE_INFINITY]
  ]) {
    const result = calculateGrout({ ...BASE_INPUT, [field]: value });
    assert.equal(result.ok, false, `${field}=${String(value)}`);
  }
});

test("grout rejects non-finite calculated output", () => {
  const result = calculateGrout({
    areaM2: 1,
    tileLengthMm: Number.MIN_VALUE,
    tileWidthMm: 1,
    jointWidthMm: 1
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CALCULATION_RANGE");
});
