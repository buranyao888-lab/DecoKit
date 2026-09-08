const { calculateGrout } = require("../../utils/calculators/index.js");
const { GROUT_DEFAULTS } = require("../../utils/calculators/defaults");
const {
  formatMeasurement,
  getConfidenceLabel,
  parseOptionalNumber,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");

const INPUT_FIELDS = Object.freeze([
  "areaM2",
  "tileLengthMm",
  "tileWidthMm",
  "jointWidthMm",
  "jointDepthMm"
]);

function createInitialData() {
  return {
    form: {
      areaM2: "",
      tileLengthMm: "",
      tileWidthMm: "",
      jointWidthMm: "",
      jointDepthMm: ""
    },
    defaultJointDepthMm: GROUT_DEFAULTS.jointDepthMm,
    result: null,
    displayResult: null,
    fieldErrors: {},
    pageError: "",
    rawError: null,
    warnings: [],
    hasCalculated: false
  };
}

function addParsedNumber(input, fieldErrors, field, raw, optional) {
  const parsed = optional
    ? parseOptionalNumber(raw)
    : parseRequiredNumber(raw);
  if (!parsed.ok) {
    fieldErrors[field] = parsed.error.message;
  } else if (!parsed.omitted) {
    input[field] = parsed.value;
  }
}

function buildCalculatorInput(form) {
  const input = {};
  const fieldErrors = {};
  addParsedNumber(input, fieldErrors, "areaM2", form.areaM2, false);
  addParsedNumber(input, fieldErrors, "tileLengthMm", form.tileLengthMm, false);
  addParsedNumber(input, fieldErrors, "tileWidthMm", form.tileWidthMm, false);
  addParsedNumber(input, fieldErrors, "jointWidthMm", form.jointWidthMm, false);
  addParsedNumber(input, fieldErrors, "jointDepthMm", form.jointDepthMm, true);
  return {
    ok: Object.keys(fieldErrors).length === 0,
    input,
    fieldErrors
  };
}

function formatResult(result) {
  return {
    totalJointLengthM: formatMeasurement(result.value.totalJointLengthM),
    volumeMl: formatMeasurement(result.value.volumeMl),
    jointLengthPerM2: formatMeasurement(result.value.jointLengthPerM2),
    confidence: getConfidenceLabel(result.meta.confidence)
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

    const result = calculateGrout(built.input);
    if (!result.ok) {
      const error = presentEngineError(result.error, INPUT_FIELDS);
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
      title: "装修计算工具 · 美缝剂用量",
      path: "/pages/grout/grout"
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
