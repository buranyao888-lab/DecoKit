const { calculatePaint } = require("../../utils/calculators/index.js");
const { PAINT_DEFAULTS } = require("../../utils/calculators/defaults");
const {
  formatMeasurement,
  getConfidenceLabel,
  parseOptionalNumber,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");

const INPUT_FIELDS = Object.freeze([
  "mode",
  "paintAreaM2",
  "perimeterM",
  "heightM",
  "openingsAreaM2",
  "includeCeiling",
  "ceilingAreaM2",
  "coverageM2PerLPerCoat",
  "coatCount",
  "reservePercent"
]);

function createInitialData() {
  return {
    form: {
      mode: "direct",
      paintAreaM2: "",
      perimeterM: "",
      heightM: "",
      openingsAreaM2: "",
      includeCeiling: false,
      ceilingAreaM2: "",
      coverageM2PerLPerCoat: String(PAINT_DEFAULTS.coverageM2PerLPerCoat),
      coatCount: String(PAINT_DEFAULTS.coatCount),
      reservePercent: String(PAINT_DEFAULTS.reserveRate * 100)
    },
    modeOptions: [
      { value: "direct", label: "直接输入面积" },
      { value: "assisted", label: "辅助计算面积" }
    ],
    advancedCollapsed: true,
    result: null,
    displayResult: null,
    fieldErrors: {},
    pageError: "",
    rawError: null,
    warnings: [],
    hasCalculated: false
  };
}

function addParsedNumber(input, fieldErrors, targetField, raw, optional, errorField) {
  const parsed = optional
    ? parseOptionalNumber(raw)
    : parseRequiredNumber(raw);
  const uiField = errorField || targetField;

  if (!parsed.ok) {
    fieldErrors[uiField] = parsed.error.message;
    return;
  }

  if (!parsed.omitted) {
    input[targetField] = parsed.value;
  }
}

function buildCalculatorInput(form) {
  const input = { mode: form.mode };
  const fieldErrors = {};

  if (form.mode === "direct") {
    addParsedNumber(input, fieldErrors, "paintAreaM2", form.paintAreaM2, false);
  } else if (form.mode === "assisted") {
    addParsedNumber(input, fieldErrors, "perimeterM", form.perimeterM, false);
    addParsedNumber(input, fieldErrors, "heightM", form.heightM, false);
    addParsedNumber(input, fieldErrors, "openingsAreaM2", form.openingsAreaM2, false);
    input.includeCeiling = form.includeCeiling;
    if (form.includeCeiling) {
      addParsedNumber(input, fieldErrors, "ceilingAreaM2", form.ceilingAreaM2, false);
    }
  } else {
    fieldErrors.mode = "请选择有效选项";
  }

  addParsedNumber(
    input,
    fieldErrors,
    "coverageM2PerLPerCoat",
    form.coverageM2PerLPerCoat,
    true
  );
  addParsedNumber(input, fieldErrors, "coatCount", form.coatCount, true);

  const reserve = parseOptionalNumber(form.reservePercent);
  if (!reserve.ok) {
    fieldErrors.reservePercent = reserve.error.message;
  } else if (!reserve.omitted) {
    input.reserveRate = reserve.value / 100;
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    input,
    fieldErrors
  };
}

function formatResult(result) {
  const value = result.value;
  const hasAssistedAreas = value.grossWallAreaM2 !== undefined;
  return {
    paintAreaM2: formatMeasurement(value.paintAreaM2),
    facePaintLiters: formatMeasurement(value.facePaintLiters),
    primerLiters: formatMeasurement(value.primerLiters),
    hasAssistedAreas,
    grossWallAreaM2: hasAssistedAreas
      ? formatMeasurement(value.grossWallAreaM2)
      : "",
    wallNetArea: hasAssistedAreas ? formatMeasurement(value.wallNetArea) : "",
    confidence: getConfidenceLabel(result.meta.confidence)
  };
}

function getUiError(error) {
  if (error.field !== "reserveRate") {
    return error;
  }

  const details = { ...error.details };
  if (details.min !== undefined) details.min *= 100;
  if (details.max !== undefined) details.max *= 100;
  return {
    ...error,
    field: "reservePercent",
    details
  };
}

function invalidatedState(fieldErrors, field) {
  const nextErrors = { ...fieldErrors };
  delete nextErrors[field];
  return {
    fieldErrors: nextErrors,
    pageError: "",
    rawError: null,
    result: null,
    displayResult: null,
    warnings: [],
    hasCalculated: false
  };
}

const pageConfig = {
  data: createInitialData(),

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    const update = invalidatedState(this.data.fieldErrors, field);
    update[`form.${field}`] = event.detail.value;
    this.setData(update);
  },

  selectMode(event) {
    const update = invalidatedState(this.data.fieldErrors, "mode");
    update["form.mode"] = event.currentTarget.dataset.value;
    this.setData(update);
  },

  onCeilingChange(event) {
    const update = invalidatedState(this.data.fieldErrors, "includeCeiling");
    update["form.includeCeiling"] = event.detail.value;
    this.setData(update);
  },

  toggleAdvanced() {
    this.setData({ advancedCollapsed: !this.data.advancedCollapsed });
  },

  calculate() {
    const built = buildCalculatorInput(this.data.form);
    if (!built.ok) {
      this.setData({
        fieldErrors: built.fieldErrors,
        pageError: "",
        rawError: null,
        result: null,
        displayResult: null,
        warnings: [],
        hasCalculated: false
      });
      return;
    }

    const result = calculatePaint(built.input);
    if (!result.ok) {
      const error = presentEngineError(getUiError(result.error), INPUT_FIELDS);
      this.setData({
        fieldErrors: error.level === "field" ? { [error.field]: error.message } : {},
        pageError: error.level === "page" ? error.message : "",
        rawError: result.error,
        result: null,
        displayResult: null,
        warnings: [],
        hasCalculated: false
      });
      return;
    }

    this.setData({
      fieldErrors: {},
      pageError: "",
      rawError: null,
      result,
      displayResult: formatResult(result),
      warnings: presentWarnings(result.meta.warnings),
      hasCalculated: true
    });
  },

  reset() {
    this.setData(createInitialData());
  },

  onShareAppMessage() {
    return {
      title: "装修计算工具 · 乳胶漆用量",
      path: "/pages/paint/paint"
    };
  }
};

Page(pageConfig);

module.exports = {
  buildCalculatorInput,
  createInitialData,
  formatResult,
  pageConfig
};
