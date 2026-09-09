const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { BUDGET_COMPONENTS } = require("../../utils/calculators/defaults");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

// All six calculator pages polished by M3.5B-1 and M3.5B-2.
const PRESENTATION_PAGES = [
  "tile",
  "flooring",
  "grout",
  "curtain",
  "paint",
  "budget"
];

// M3.5B-1 scope: the four simple calculator pages.
const B1_PAGES = ["tile", "flooring", "grout", "curtain"];

// Pages whose frozen Engine contract emits a warning with every successful result.
const WARNING_PAGES = ["grout", "curtain", "budget"];

// Frozen M3 numeric/text input inventory rendered through data-field.
const EXPECTED_INPUT_FIELDS = Object.freeze({
  tile: ["areaM2", "merchantPieces", "piecesPerBox", "tileLengthMm", "tileWidthMm"],
  flooring: ["boxCoverageM2", "netAreaM2"],
  grout: ["areaM2", "jointDepthMm", "jointWidthMm", "tileLengthMm", "tileWidthMm"],
  curtain: ["trackWidthM"],
  paint: [
    "ceilingAreaM2",
    "coatCount",
    "coverageM2PerLPerCoat",
    "heightM",
    "openingsAreaM2",
    "paintAreaM2",
    "perimeterM",
    "reservePercent"
  ],
  budget: BUDGET_COMPONENTS.slice().sort()
});

// Frozen Paint advanced-parameter fields that live inside the collapsible section.
const PAINT_ADVANCED_FIELDS = [
  "coverageM2PerLPerCoat",
  "coatCount",
  "reservePercent"
];

const EXPECTED_INPUT_COUNT = Object.freeze({ paint: 8, budget: 10 });

function readPageFile(name, extension) {
  return fs.readFileSync(
    path.join(PROJECT_ROOT, "pages", name, `${name}.${extension}`),
    "utf8"
  );
}

function loadPageModule(name) {
  const filename = path.join(PROJECT_ROOT, "pages", name, `${name}.js`);
  delete require.cache[require.resolve(filename)];
  const previousPage = globalThis.Page;
  globalThis.Page = () => {};

  try {
    return require(filename);
  } finally {
    globalThis.Page = previousPage;
  }
}

function mustacheExpressions(source) {
  return Array.from(source.matchAll(/\{\{([\s\S]*?)\}\}/g), match => match[1]);
}

function withoutStringLiterals(expression) {
  return expression.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");
}

function dataFieldNames(source) {
  const names = Array.from(
    source.matchAll(/data-field="([A-Za-z0-9_]+)"/g),
    match => match[1]
  );
  return Array.from(new Set(names)).sort();
}

function dataFieldSequence(source) {
  return Array.from(
    source.matchAll(/data-field="([A-Za-z0-9_]+)"/g),
    match => match[1]
  );
}

function inputTags(source) {
  return source.match(/<input\b[^>]*>/g) || [];
}

function countOccurrences(source, literal) {
  return source.split(literal).length - 1;
}

test("warning pages preserve their frozen warning rendering", () => {
  for (const name of WARNING_PAGES) {
    const source = readPageFile(name, "wxml");
    assert.match(source, /class="warning-list"/, name);
    assert.match(source, /wx:for="\{\{warnings\}\}"/, name);
    assert.match(source, /wx:key="code"/, name);
    assert.match(source, /\{\{item\.message\}\}/, name);
  }
});

test("all six calculator pages keep the confidence label rendering", () => {
  for (const name of PRESENTATION_PAGES) {
    const source = readPageFile(name, "wxml");
    assert.match(source, /class="confidence-badge"/, name);
    assert.match(source, /\{\{displayResult\.confidence\}\}/, name);
  }
});

test("calculator WXML expressions contain no business arithmetic", () => {
  const forbidden = /[+*/%-]|Math\.|toFixed|parseInt|parseFloat|Number\s*\(/;

  for (const name of PRESENTATION_PAGES) {
    const expressions = mustacheExpressions(readPageFile(name, "wxml"));
    assert.ok(expressions.length > 0, name);

    for (const expression of expressions) {
      assert.doesNotMatch(
        withoutStringLiterals(expression),
        forbidden,
        `${name}: {{${expression}}}`
      );
    }
  }
});

test("calculator WXML input fields match the frozen M3 input inventory", () => {
  for (const name of PRESENTATION_PAGES) {
    const rendered = dataFieldNames(readPageFile(name, "wxml"));
    assert.deepEqual(rendered, EXPECTED_INPUT_FIELDS[name], name);

    const formKeys = Object.keys(loadPageModule(name).createInitialData().form);
    for (const field of rendered) {
      assert.ok(formKeys.includes(field), `${name}.${field}`);
    }
  }
});

test("M3.5B-1 selector and share bindings keep their frozen dataset contracts", () => {
  for (const name of B1_PAGES) {
    assert.match(readPageFile(name, "wxml"), /open-type="share"/, name);
  }

  for (const name of ["tile", "flooring"]) {
    const source = readPageFile(name, "wxml");
    assert.match(source, /wx:for="\{\{layingOptions\}\}"/, name);
    assert.match(source, /data-value="\{\{item\.value\}\}"/, name);
    assert.match(source, /bindtap="selectLayingMode"/, name);
  }

  const curtain = readPageFile("curtain", "wxml");
  assert.equal(curtain.match(/data-index="\{\{index\}\}"/g).length, 2);
  assert.match(curtain, /wx:for="\{\{fullnessOptions\}\}"/);
  assert.match(curtain, /wx:for="\{\{panelOptions\}\}"/);
  assert.match(curtain, /bindtap="selectFullness"/);
  assert.match(curtain, /bindtap="selectPanels"/);
});

test("Budget renders exactly the ten frozen components in frozen order", () => {
  const sequence = dataFieldSequence(readPageFile("budget", "wxml"));

  assert.equal(sequence.length, BUDGET_COMPONENTS.length);
  assert.equal(new Set(sequence).size, BUDGET_COMPONENTS.length);
  assert.deepEqual(sequence, BUDGET_COMPONENTS.slice());
});

test("Paint preserves its frozen conditional rendering expressions", () => {
  const source = readPageFile("paint", "wxml");

  for (const condition of [
    `wx:if="{{form.mode === 'direct'}}"`,
    `wx:if="{{form.mode === 'assisted'}}"`,
    `wx:if="{{form.includeCeiling}}"`,
    `wx:if="{{!advancedCollapsed}}"`
  ]) {
    assert.equal(countOccurrences(source, condition), 1, condition);
  }
});

test("Paint and Budget inputs keep the keyboard cursor spacing", () => {
  for (const name of ["paint", "budget"]) {
    const tags = inputTags(readPageFile(name, "wxml"));
    assert.equal(tags.length, EXPECTED_INPUT_COUNT[name], name);

    for (const tag of tags) {
      assert.match(tag, /cursor-spacing="24"/, `${name}: ${tag}`);
    }
  }
});

test("Paint surfaces collapsed advanced-field errors only while collapsed", () => {
  const source = readPageFile("paint", "wxml");

  for (const field of PAINT_ADVANCED_FIELDS) {
    // The external summary must exist and must stay gated by advancedCollapsed.
    assert.equal(
      countOccurrences(source, `wx:if="{{advancedCollapsed && fieldErrors.${field}}}"`),
      1,
      `${field}: gated external error`
    );

    // The in-section error stays the only ungated rendering, so an external
    // duplicate that becomes permanently visible fails this contract.
    assert.equal(
      countOccurrences(source, `wx:if="{{fieldErrors.${field}}}"`),
      1,
      `${field}: ungated error rendering`
    );
  }
});
