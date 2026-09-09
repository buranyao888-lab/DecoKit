"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const { reportCalculationSuccess } = require("../../utils/analytics.js");

const CALCULATORS = ["tile", "paint", "grout", "flooring", "curtain", "budget"];

const PROJECT_ROOT = path.resolve(__dirname, "../..");

function withWx(impl, fn) {
  const previous = globalThis.wx;
  globalThis.wx = { reportEvent: impl };
  try {
    return fn();
  } finally {
    globalThis.wx = previous;
  }
}

// T1 + T2: exact event name and minimal payload shape.
test("reportCalculationSuccess uses exact event name and minimal payload", () => {
  const calls = [];
  withWx((name, payload) => calls.push([name, payload]), () => {
    reportCalculationSuccess("paint");
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "calculation_success");
  assert.deepEqual(calls[0][1], { calculator: "paint" });
  assert.equal(Object.keys(calls[0][1]).length, 1);
});

// T3: all six frozen keys accepted; invalid keys rejected.
test("all frozen calculator keys are accepted", () => {
  for (const key of CALCULATORS) {
    const calls = [];
    withWx((name, payload) => calls.push([name, payload]), () => {
      reportCalculationSuccess(key);
    });
    assert.equal(calls.length, 1, `expected report for ${key}`);
    assert.equal(calls[0][1].calculator, key, `wrong key for ${key}`);
  }
});

test("invalid calculator keys do not report", () => {
  const invalid = ["", "Paint", "TILE", "unknown", "tile ", "budgetx", null, 42, undefined];
  for (const key of invalid) {
    const calls = [];
    withWx((name, payload) => calls.push([name, payload]), () => {
      reportCalculationSuccess(key);
    });
    assert.equal(calls.length, 0, `should reject: ${String(key)}`);
  }
});

// T4: wx absent / API absent / synchronous throw must not throw.
test("helper does not throw when wx is absent", () => {
  const previous = globalThis.wx;
  delete globalThis.wx;
  try {
    assert.doesNotThrow(() => reportCalculationSuccess("tile"));
  } finally {
    globalThis.wx = previous;
  }
});

test("helper does not throw when wx.reportEvent is not a function", () => {
  withWx({}, () => {
    assert.doesNotThrow(() => reportCalculationSuccess("tile"));
  });
});

test("helper does not throw when wx.reportEvent throws", () => {
  withWx(() => {
    throw new Error("boom");
  }, () => {
    assert.doesNotThrow(() => reportCalculationSuccess("tile"));
  });
});

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

function validForm(name) {
  const base = loadPage(name).createInitialData().form;
  switch (name) {
    case "tile":
      return { ...base, areaM2: "10", tileLengthMm: "600", tileWidthMm: "600", layingMode: "straight" };
    case "paint":
      return { ...base, mode: "direct", paintAreaM2: "100" };
    case "grout":
      return { ...base, areaM2: "10", tileLengthMm: "600", tileWidthMm: "600", jointWidthMm: "2" };
    case "flooring":
      return { ...base, netAreaM2: "10", layingMode: "straight" };
    case "curtain":
      return { ...base, trackWidthM: "3" };
    case "budget":
      return {
        baseConstruction: "1",
        plumbingElectrical: "2",
        masonry: "3",
        carpentry: "4",
        painting: "5",
        mainMaterials: "6",
        customization: "7",
        kitchenBathroom: "8",
        installation: "9",
        contingency: "10"
      };
    default:
      throw new Error(`unknown page ${name}`);
  }
}

function invalidForm(name) {
  const base = loadPage(name).createInitialData().form;
  switch (name) {
    case "tile":
      return { ...base, areaM2: "10", tileLengthMm: "600", tileWidthMm: "600" };
    case "paint":
      return { ...base, mode: "direct" };
    case "grout":
      return { ...base, tileLengthMm: "600", tileWidthMm: "600", jointWidthMm: "2" };
    case "flooring":
      return { ...base, netAreaM2: "10" };
    case "curtain":
      return { ...base };
    case "budget":
      return {
        baseConstruction: "",
        plumbingElectrical: "2",
        masonry: "3",
        carpentry: "4",
        painting: "5",
        mainMaterials: "6",
        customization: "7",
        kitchenBathroom: "8",
        installation: "9",
        contingency: "10"
      };
    default:
      throw new Error(`unknown page ${name}`);
  }
}

// T5: six-page success integration emits exactly one correct event.
test("each calculator reports exactly one calculation_success on successful calculate", () => {
  for (const name of CALCULATORS) {
    const page = loadPage(name);
    const calls = [];
    let hasCalculated = null;
    withWx((eventName, payload) => calls.push([eventName, payload]), () => {
      const instance = createPageInstance(page);
      instance.data.form = validForm(name);
      page.pageConfig.calculate.call(instance);
      hasCalculated = instance.data.hasCalculated;
    });
    assert.equal(calls.length, 1, `${name}: expected exactly one report`);
    assert.equal(calls[0][0], "calculation_success", name);
    assert.deepEqual(calls[0][1], { calculator: name }, name);
    assert.equal(hasCalculated, true, `${name}: calculate should have succeeded`);
  }
});

// T6: validation failure emits zero events.
test("validation failure reports zero events", () => {
  for (const name of CALCULATORS) {
    const page = loadPage(name);
    const calls = [];
    let hasCalculated = null;
    withWx((eventName, payload) => calls.push([eventName, payload]), () => {
      const instance = createPageInstance(page);
      instance.data.form = invalidForm(name);
      page.pageConfig.calculate.call(instance);
      hasCalculated = instance.data.hasCalculated;
    });
    assert.equal(calls.length, 0, `${name}: expected zero reports on validation failure`);
    assert.equal(hasCalculated, false, `${name}: calculate should have failed validation`);
  }
});
