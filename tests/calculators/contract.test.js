const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const calculators = require("../../utils/calculators");
const {
  CONFIDENCE,
  CURTAIN_DEFAULTS,
  FLOORING_LOSS_RATES,
  GROUT_DEFAULTS,
  PAINT_DEFAULTS,
  TILE_LOSS_RATES
} = require("../../utils/calculators/defaults");

const budgetInput = {
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
};

const cases = [
  [
    "tile",
    calculators.calculateTile,
    { areaM2: 10, tileLengthMm: 600, tileWidthMm: 600, layingMode: "straight" }
  ],
  [
    "paint",
    calculators.calculatePaint,
    { mode: "direct", paintAreaM2: 100 }
  ],
  [
    "grout",
    calculators.calculateGrout,
    { areaM2: 10, tileLengthMm: 600, tileWidthMm: 600, jointWidthMm: 2 }
  ],
  [
    "flooring",
    calculators.calculateFlooring,
    { netAreaM2: 100, layingMode: "straight", irregularRoom: false }
  ],
  [
    "curtain",
    calculators.calculateCurtain,
    { trackWidthM: 3 }
  ],
  ["budget", calculators.calculateBudget, budgetInput]
];

test("public entry exports exactly six named calculator functions", () => {
  assert.deepEqual(Object.keys(calculators).sort(), [
    "calculateBudget",
    "calculateCurtain",
    "calculateFlooring",
    "calculateGrout",
    "calculatePaint",
    "calculateTile"
  ]);

  for (const calculator of Object.values(calculators)) {
    assert.equal(typeof calculator, "function");
  }
});

test("all calculators use the successful result contract", () => {
  for (const [name, calculate, input] of cases) {
    const result = calculate(input);
    assert.equal(result.ok, true, name);
    assert.equal(typeof result.value, "object", name);
    assert.equal(result.meta.calculator, name);
    assert.equal(typeof result.meta.confidence, "string", name);
    assert.equal(typeof result.meta.units, "object", name);
    assert.ok(Array.isArray(result.meta.warnings), name);
  }
});

test("all calculated numeric outputs are finite JavaScript numbers", () => {
  for (const [name, calculate, input] of cases) {
    const result = calculate(input);
    for (const [field, value] of Object.entries(result.value)) {
      if (typeof value === "number") {
        assert.equal(Number.isFinite(value), true, `${name}.${field}`);
      }
    }
  }
});

test("all calculators return structured errors for invalid input objects", () => {
  for (const [name, calculate] of cases) {
    for (const input of [null, undefined, [], "invalid", 1]) {
      assert.doesNotThrow(() => calculate(input), name);
      const result = calculate(input);
      assert.deepEqual(result, {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          field: null,
          details: {}
        }
      });
    }
  }
});

test("all calculators are deterministic", () => {
  for (const [name, calculate, input] of cases) {
    assert.deepEqual(calculate(input), calculate(input), name);
  }
});

test("all calculators leave caller input unchanged", () => {
  for (const [name, calculate, input] of cases) {
    const mutableInput = { ...input };
    const before = structuredClone(mutableInput);
    calculate(mutableInput);
    assert.deepEqual(mutableInput, before, name);
  }
});

test("frozen defaults match formulas and decision record", () => {
  assert.deepEqual(TILE_LOSS_RATES, {
    straight: 0.05,
    staggered: 0.08,
    complex: 0.1
  });
  assert.deepEqual(FLOORING_LOSS_RATES, {
    straight: 0.05,
    staggered: 0.08,
    herringbone: 0.15
  });
  assert.deepEqual(PAINT_DEFAULTS, {
    coverageM2PerLPerCoat: 13,
    coatCount: 2,
    reserveRate: 0.1,
    primerCoverage: 11,
    primerCoats: 1,
    primerReserveRate: 0.1
  });
  assert.deepEqual(GROUT_DEFAULTS, { jointDepthMm: 3 });
  assert.deepEqual(CURTAIN_DEFAULTS, { fullness: 1.8, panels: 2 });
  assert.deepEqual(CONFIDENCE, {
    TILE: "high",
    PAINT: "medium_high",
    FLOORING: "medium_high",
    GROUT: "reference",
    CURTAIN: "medium_high",
    BUDGET: "rough"
  });
});

test("calculator modules are UI, cloud, network, time, random, and AI independent", () => {
  const calculatorDirectory = path.resolve(__dirname, "../../utils/calculators");
  const forbidden = /\b(?:wx|Page|App|document|window|fetch|XMLHttpRequest|CloudBase|Date)\b|Math\.random|https?:\/\//;

  for (const entry of fs.readdirSync(calculatorDirectory)) {
    if (!entry.endsWith(".js")) continue;
    const source = fs.readFileSync(path.join(calculatorDirectory, entry), "utf8");
    assert.doesNotMatch(source, forbidden, entry);
  }

  const previous = {
    wx: globalThis.wx,
    Page: globalThis.Page,
    App: globalThis.App
  };
  delete globalThis.wx;
  delete globalThis.Page;
  delete globalThis.App;

  try {
    for (const [name, calculate, input] of cases) {
      assert.equal(calculate(input).ok, true, name);
    }
  } finally {
    globalThis.wx = previous.wx;
    globalThis.Page = previous.Page;
    globalThis.App = previous.App;
  }
});
