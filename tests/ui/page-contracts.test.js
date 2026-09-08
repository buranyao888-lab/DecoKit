const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const calculators = require("../../utils/calculators/index.js");
const {
  BUDGET_COMPONENTS,
  CURTAIN_DEFAULTS,
  PAINT_DEFAULTS
} = require("../../utils/calculators/defaults");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PAGE_SPECS = [
  ["tile", "calculateTile"],
  ["paint", "calculatePaint"],
  ["grout", "calculateGrout"],
  ["flooring", "calculateFlooring"],
  ["curtain", "calculateCurtain"],
  ["budget", "calculateBudget"]
];

function loadPage(name) {
  const filename = path.join(PROJECT_ROOT, "pages", name, `${name}.js`);
  delete require.cache[require.resolve(filename)];
  const previousPage = globalThis.Page;
  let registered;
  globalThis.Page = config => {
    registered = config;
  };

  try {
    const exported = require(filename);
    assert.equal(exported.pageConfig, registered);
    return exported;
  } finally {
    globalThis.Page = previousPage;
  }
}

function setPath(object, dottedPath, value) {
  const parts = dottedPath.split(".");
  let target = object;
  for (let index = 0; index < parts.length - 1; index += 1) {
    target = target[parts[index]];
  }
  target[parts[parts.length - 1]] = value;
}

function createPageInstance(exported) {
  return {
    data: structuredClone(exported.pageConfig.data),
    setData(update) {
      for (const [field, value] of Object.entries(update)) {
        setPath(this.data, field, structuredClone(value));
      }
    }
  };
}

function inputEvent(field, value) {
  return {
    currentTarget: { dataset: { field } },
    detail: { value }
  };
}

test("all six pages import and name the real public Calculator API", () => {
  for (const [name, calculatorName] of PAGE_SPECS) {
    const source = fs.readFileSync(
      path.join(PROJECT_ROOT, "pages", name, `${name}.js`),
      "utf8"
    );
    assert.match(
      source,
      /require\("\.\.\/\.\.\/utils\/calculators\/index\.js"\)/,
      name
    );
    assert.match(source, new RegExp(`\\b${calculatorName}\\b`), name);
    assert.equal(typeof calculators[calculatorName], "function", name);
  }
});

test("Tile maps raw strings, omits optional empties, and uses the real Engine", () => {
  const tile = loadPage("tile");
  const form = {
    areaM2: "10",
    tileLengthMm: "600",
    tileWidthMm: "600",
    layingMode: "straight",
    piecesPerBox: "",
    merchantPieces: ""
  };
  const built = tile.buildCalculatorInput(form);
  assert.deepEqual(built.input, {
    areaM2: 10,
    tileLengthMm: 600,
    tileWidthMm: 600,
    layingMode: "straight"
  });

  const page = createPageInstance(tile);
  page.data.form = form;
  tile.pageConfig.calculate.call(page);
  assert.deepEqual(page.data.result, calculators.calculateTile(built.input));
  assert.equal(typeof page.data.result.value.recommendedPieces, "number");
});

test("Tile requires an explicit laying mode and maps merchant output", () => {
  const tile = loadPage("tile");
  const initial = tile.createInitialData();
  assert.equal(initial.form.layingMode, "");

  const missingMode = tile.buildCalculatorInput({
    ...initial.form,
    areaM2: "10",
    tileLengthMm: "600",
    tileWidthMm: "600"
  });
  assert.equal(missingMode.ok, false);
  assert.equal(missingMode.fieldErrors.layingMode, "请选择铺贴方式");

  const input = tile.buildCalculatorInput({
    areaM2: "95",
    tileLengthMm: "1000",
    tileWidthMm: "1000",
    layingMode: "straight",
    piecesPerBox: "10",
    merchantPieces: "110"
  }).input;
  const display = tile.formatResult(calculators.calculateTile(input));
  assert.equal(display.hasBoxes, true);
  assert.equal(display.hasMerchant, true);
  assert.equal(display.merchantDifferenceBand, "略高，建议确认备用砖");
});

test("Paint direct mapping uses defaults from the frozen defaults module", () => {
  const paint = loadPage("paint");
  const initial = paint.createInitialData();
  assert.equal(initial.form.mode, "direct");
  assert.equal(initial.form.includeCeiling, false);
  assert.equal(initial.advancedCollapsed, true);
  assert.equal(initial.form.coverageM2PerLPerCoat, String(PAINT_DEFAULTS.coverageM2PerLPerCoat));
  assert.equal(initial.form.coatCount, String(PAINT_DEFAULTS.coatCount));
  assert.equal(initial.form.reservePercent, String(PAINT_DEFAULTS.reserveRate * 100));

  initial.form.paintAreaM2 = "100";
  const built = paint.buildCalculatorInput(initial.form);
  assert.equal(built.input.mode, "direct");
  assert.equal(built.input.paintAreaM2, 100);
  assert.equal(built.input.reserveRate, PAINT_DEFAULTS.reserveRate);
  assert.equal(Object.hasOwn(built.input, "perimeterM"), false);
});

test("Paint assisted mapping handles ceiling conditions and reserve percentage", () => {
  const paint = loadPage("paint");
  const form = paint.createInitialData().form;
  Object.assign(form, {
    mode: "assisted",
    perimeterM: "20",
    heightM: "2.8",
    openingsAreaM2: "6",
    includeCeiling: false,
    ceilingAreaM2: "25",
    reservePercent: "15"
  });

  const withoutCeiling = paint.buildCalculatorInput(form);
  assert.equal(withoutCeiling.input.includeCeiling, false);
  assert.equal(Object.hasOwn(withoutCeiling.input, "ceilingAreaM2"), false);
  assert.equal(withoutCeiling.input.reserveRate, 0.15);

  form.includeCeiling = true;
  const withCeiling = paint.buildCalculatorInput(form);
  assert.equal(withCeiling.input.ceilingAreaM2, 25);

  const page = createPageInstance(paint);
  page.data.form = form;
  paint.pageConfig.calculate.call(page);
  assert.deepEqual(page.data.result, calculators.calculatePaint(withCeiling.input));
  assert.equal(page.data.displayResult.hasAssistedAreas, true);
});

test("Paint keeps raw reserve errors while presenting the UI percentage range", () => {
  const paint = loadPage("paint");
  const page = createPageInstance(paint);
  page.data.form.paintAreaM2 = "100";
  page.data.form.reservePercent = "50";

  paint.pageConfig.calculate.call(page);
  assert.equal(page.data.rawError.code, "OUT_OF_RANGE");
  assert.equal(page.data.rawError.field, "reserveRate");
  assert.equal(page.data.fieldErrors.reservePercent, "请输入 0 至 20 范围内的数值");
});

test("Grout omits empty depth and surfaces the real Engine warning", () => {
  const grout = loadPage("grout");
  const form = {
    areaM2: "10",
    tileLengthMm: "600",
    tileWidthMm: "600",
    jointWidthMm: "2",
    jointDepthMm: ""
  };
  const built = grout.buildCalculatorInput(form);
  assert.equal(Object.hasOwn(built.input, "jointDepthMm"), false);

  const page = createPageInstance(grout);
  page.data.form = form;
  grout.pageConfig.calculate.call(page);
  assert.deepEqual(page.data.result, calculators.calculateGrout(built.input));
  assert.equal(page.data.warnings[0].code, "GROUT_REFERENCE_ONLY");
});

test("Flooring requires laying mode and omits empty box coverage", () => {
  const flooring = loadPage("flooring");
  const initial = flooring.createInitialData();
  assert.equal(initial.form.layingMode, "");
  assert.equal(initial.form.irregularRoom, false);

  const missingMode = flooring.buildCalculatorInput({
    ...initial.form,
    netAreaM2: "30"
  });
  assert.equal(missingMode.ok, false);
  assert.equal(missingMode.fieldErrors.layingMode, "请选择铺装方式");

  const built = flooring.buildCalculatorInput({
    netAreaM2: "30",
    layingMode: "herringbone",
    irregularRoom: true,
    boxCoverageM2: ""
  });
  assert.equal(Object.hasOwn(built.input, "boxCoverageM2"), false);
  const page = createPageInstance(flooring);
  page.data.form = {
    netAreaM2: "30",
    layingMode: "herringbone",
    irregularRoom: true,
    boxCoverageM2: ""
  };
  flooring.pageConfig.calculate.call(page);
  assert.deepEqual(page.data.result, calculators.calculateFlooring(built.input));
});

test("Curtain uses frozen defaults and returns warning presentation", () => {
  const curtain = loadPage("curtain");
  const initial = curtain.createInitialData();
  assert.equal(initial.form.fullness, CURTAIN_DEFAULTS.fullness);
  assert.equal(initial.form.panels, CURTAIN_DEFAULTS.panels);
  initial.form.trackWidthM = "3";

  const built = curtain.buildCalculatorInput(initial.form);
  const page = createPageInstance(curtain);
  page.data.form = initial.form;
  curtain.pageConfig.calculate.call(page);
  assert.deepEqual(page.data.result, calculators.calculateCurtain(built.input));
  assert.equal(page.data.warnings[0].code, "CURTAIN_HEIGHT_MEASUREMENT_REQUIRED");
});

test("Budget distinguishes explicit zero from a missing component", () => {
  const budget = loadPage("budget");
  const zeroForm = budget.createInitialData().form;
  for (const field of BUDGET_COMPONENTS) {
    zeroForm[field] = "0";
  }
  const zeroInput = budget.buildCalculatorInput(zeroForm);
  assert.equal(zeroInput.ok, true);
  assert.deepEqual(zeroInput.input, Object.fromEntries(BUDGET_COMPONENTS.map(field => [field, 0])));

  zeroForm.carpentry = "";
  const missing = budget.buildCalculatorInput(zeroForm);
  assert.equal(missing.ok, false);
  assert.equal(missing.fieldErrors.carpentry, "请填写此项");
});

test("Budget calls the real Engine without metadata and presents its warning", () => {
  const budget = loadPage("budget");
  const form = budget.createInitialData().form;
  BUDGET_COMPONENTS.forEach((field, index) => {
    form[field] = String(index);
  });
  const built = budget.buildCalculatorInput(form);
  const page = createPageInstance(budget);
  page.data.form = form;
  budget.pageConfig.calculate.call(page);

  assert.deepEqual(page.data.result, calculators.calculateBudget(built.input));
  assert.equal(page.data.result.meta.metadata, undefined);
  assert.equal(page.data.warnings[0].code, "BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION");
});

test("Engine field errors remain raw and map to the edited field", () => {
  const tile = loadPage("tile");
  const page = createPageInstance(tile);
  page.data.form = {
    areaM2: "-1",
    tileLengthMm: "600",
    tileWidthMm: "600",
    layingMode: "straight",
    piecesPerBox: "",
    merchantPieces: ""
  };

  tile.pageConfig.calculate.call(page);
  assert.equal(page.data.rawError.code, "OUT_OF_RANGE");
  assert.equal(page.data.rawError.field, "areaM2");
  assert.equal(page.data.fieldErrors.areaM2, "请输入大于 0 的数值");
  assert.equal(page.data.pageError, "");
});

test("input changes invalidate result without clearing unrelated input", () => {
  const tile = loadPage("tile");
  const page = createPageInstance(tile);
  page.data.form = {
    areaM2: "10",
    tileLengthMm: "600",
    tileWidthMm: "600",
    layingMode: "straight",
    piecesPerBox: "",
    merchantPieces: ""
  };
  tile.pageConfig.calculate.call(page);
  assert.equal(page.data.hasCalculated, true);

  page.data.fieldErrors = { areaM2: "旧错误", tileWidthMm: "保留错误" };
  tile.pageConfig.onInput.call(page, inputEvent("areaM2", "12"));
  assert.equal(page.data.form.areaM2, "12");
  assert.equal(page.data.form.tileLengthMm, "600");
  assert.equal(page.data.result, null);
  assert.equal(page.data.displayResult, null);
  assert.deepEqual(page.data.warnings, []);
  assert.equal(page.data.hasCalculated, false);
  assert.equal(page.data.fieldErrors.areaM2, undefined);
  assert.equal(page.data.fieldErrors.tileWidthMm, "保留错误");
});

test("reset restores Paint UI defaults without calculating", () => {
  const paint = loadPage("paint");
  const page = createPageInstance(paint);
  page.data.form.mode = "assisted";
  page.data.form.paintAreaM2 = "100";
  page.data.form.includeCeiling = true;
  page.data.advancedCollapsed = false;
  page.data.result = { old: true };
  page.data.displayResult = { old: true };
  page.data.hasCalculated = true;
  page.data.warnings = [{ code: "OLD" }];

  paint.pageConfig.reset.call(page);
  const expected = paint.createInitialData();
  assert.deepEqual(page.data, expected);
  assert.equal(page.data.form.mode, "direct");
  assert.equal(page.data.form.includeCeiling, false);
});

test("display formatting never replaces the raw Calculator result", () => {
  const flooring = loadPage("flooring");
  const page = createPageInstance(flooring);
  page.data.form = {
    netAreaM2: "100",
    layingMode: "herringbone",
    irregularRoom: true,
    boxCoverageM2: ""
  };
  flooring.pageConfig.calculate.call(page);
  assert.equal(typeof page.data.result.value.purchaseAreaM2, "number");
  assert.equal(typeof page.data.displayResult.purchaseAreaM2, "string");
  assert.equal(typeof page.data.result.value.lossRate, "number");
  assert.match(page.data.displayResult.lossRate, /%$/);
});

test("all six pages expose neutral native share metadata", () => {
  for (const [name] of PAGE_SPECS) {
    const page = loadPage(name);
    const share = page.pageConfig.onShareAppMessage();
    assert.match(share.title, /^装修计算工具 · /, name);
    assert.equal(share.path, `/pages/${name}/${name}`, name);
    assert.equal(Object.hasOwn(share, "imageUrl"), false, name);
  }
});

test("every WXML event handler resolves to a page method", () => {
  for (const [name] of PAGE_SPECS) {
    const page = loadPage(name);
    const source = fs.readFileSync(
      path.join(PROJECT_ROOT, "pages", name, `${name}.wxml`),
      "utf8"
    );
    const handlers = Array.from(
      source.matchAll(/bind(?:tap|input|change)="([A-Za-z0-9_]+)"/g),
      match => match[1]
    );
    assert.ok(handlers.length > 0, name);
    for (const handler of handlers) {
      assert.equal(typeof page.pageConfig[handler], "function", `${name}.${handler}`);
    }
    assert.match(source, /open-type="share"/, name);
  }
});

test("all six page reset handlers restore their complete initial state", () => {
  for (const [name] of PAGE_SPECS) {
    const page = loadPage(name);
    const instance = createPageInstance(page);
    instance.data.result = { stale: true };
    instance.data.displayResult = { stale: true };
    instance.data.fieldErrors = { field: "旧错误" };
    instance.data.pageError = "旧错误";
    instance.data.rawError = { code: "OLD" };
    instance.data.warnings = [{ code: "OLD" }];
    instance.data.hasCalculated = true;

    page.pageConfig.reset.call(instance);
    assert.deepEqual(instance.data, page.createInitialData(), name);
  }
});

test("production UI code has no Calculator formula duplication or native-incompatible APIs", () => {
  const files = PAGE_SPECS.map(([name]) =>
    path.join(PROJECT_ROOT, "pages", name, `${name}.js`)
  ).concat(path.join(PROJECT_ROOT, "utils/calculator-ui.js"));
  const forbiddenRuntime = /\b(?:process|Buffer|document|window|fetch|XMLHttpRequest)\b|require\("node:|require\("fs"|require\("path"|https?:\/\//;
  const forbiddenFormula = /Math\.ceil|merchantExcessRate\s*=|theoreticalPieces\s*\*|purchaseAreaM2\s*=|facePaintLiters\s*=|volumeM3\s*=|totalBudget\s*=/;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, forbiddenRuntime, file);
    assert.doesNotMatch(source, forbiddenFormula, file);
  }
});
