const { calculateTile } = require("../../utils/calculators/index.js");
const {
  formatInteger,
  formatRatio,
  getConfidenceLabel,
  parseOptionalNumber,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");
const { reportCalculationSuccess } = require("../../utils/analytics.js");

const CALCULATOR_KEY = "tile";

const INPUT_FIELDS = Object.freeze([
  "areaM2",
  "tileLengthMm",
  "tileWidthMm",
  "layingMode",
  "piecesPerBox",
  "merchantPieces"
]);

const MERCHANT_BAND_MESSAGES = Object.freeze({
  NORMAL_REFERENCE_RANGE: "正常参考范围",
  SLIGHTLY_HIGH: "略高，建议确认备用砖",
  SIGNIFICANTLY_HIGH: "明显偏高，建议询问切割、备用砖或特殊铺贴",
  LARGE_DIFFERENCE: "差异较大，建议重新核算"
});

function createInitialData() {
  return {
    form: {
      areaM2: "",
      tileLengthMm: "",
      tileWidthMm: "",
      layingMode: "",
      piecesPerBox: "",
      merchantPieces: ""
    },
    layingOptions: [
      { value: "straight", label: "普通直铺" },
      { value: "staggered", label: "通铺 / 工字铺" },
      { value: "complex", label: "斜铺 / 复杂空间" }
    ],
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
    return;
  }

  if (!parsed.omitted) {
    input[field] = parsed.value;
  }
}

function buildCalculatorInput(form) {
  const input = {};
  const fieldErrors = {};

  addParsedNumber(input, fieldErrors, "areaM2", form.areaM2, false);
  addParsedNumber(input, fieldErrors, "tileLengthMm", form.tileLengthMm, false);
  addParsedNumber(input, fieldErrors, "tileWidthMm", form.tileWidthMm, false);
  addParsedNumber(input, fieldErrors, "piecesPerBox", form.piecesPerBox, true);
  addParsedNumber(input, fieldErrors, "merchantPieces", form.merchantPieces, true);

  if (!form.layingMode) {
    fieldErrors.layingMode = "请选择铺贴方式";
  } else {
    input.layingMode = form.layingMode;
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    input,
    fieldErrors
  };
}

function formatResult(result) {
  const value = result.value;
  const hasMerchant = value.merchantDifferenceBand !== undefined;

  return {
    theoreticalPieces: formatInteger(value.theoreticalPieces),
    recommendedPieces: formatInteger(value.recommendedPieces),
    lossRate: formatRatio(value.lossRate),
    hasBoxes: value.boxes !== null,
    boxes: value.boxes === null ? "" : formatInteger(value.boxes),
    hasMerchant,
    merchantExcessRate: hasMerchant ? formatRatio(value.merchantExcessRate) : "",
    merchantDifferenceBand: hasMerchant
      ? MERCHANT_BAND_MESSAGES[value.merchantDifferenceBand] || "差异结果暂无法显示"
      : "",
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

  selectLayingMode(event) {
    const update = invalidatedState(this.data.fieldErrors, "layingMode");
    update["form.layingMode"] = event.currentTarget.dataset.value;
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

    const result = calculateTile(built.input);
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
    reportCalculationSuccess(CALCULATOR_KEY);
  },

  reset() {
    this.setData(createInitialData());
  },

  onShareAppMessage() {
    return {
      title: "装修计算工具 · 瓷砖用量",
      path: "/pages/tile/tile"
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
