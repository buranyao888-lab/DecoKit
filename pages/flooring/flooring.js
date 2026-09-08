const { calculateFlooring } = require("../../utils/calculators/index.js");
const {
  formatInteger,
  formatMeasurement,
  formatRatio,
  getConfidenceLabel,
  parseOptionalNumber,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");

const INPUT_FIELDS = Object.freeze([
  "netAreaM2",
  "layingMode",
  "irregularRoom",
  "boxCoverageM2"
]);

function createInitialData() {
  return {
    form: {
      netAreaM2: "",
      layingMode: "",
      irregularRoom: false,
      boxCoverageM2: ""
    },
    layingOptions: [
      { value: "straight", label: "普通直铺" },
      { value: "staggered", label: "通铺 / 工字铺" },
      { value: "herringbone", label: "人字拼" }
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

function buildCalculatorInput(form) {
  const input = { irregularRoom: form.irregularRoom };
  const fieldErrors = {};
  const area = parseRequiredNumber(form.netAreaM2);
  const boxCoverage = parseOptionalNumber(form.boxCoverageM2);

  if (area.ok) {
    input.netAreaM2 = area.value;
  } else {
    fieldErrors.netAreaM2 = area.error.message;
  }

  if (!form.layingMode) {
    fieldErrors.layingMode = "请选择铺装方式";
  } else {
    input.layingMode = form.layingMode;
  }

  if (!boxCoverage.ok) {
    fieldErrors.boxCoverageM2 = boxCoverage.error.message;
  } else if (!boxCoverage.omitted) {
    input.boxCoverageM2 = boxCoverage.value;
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    input,
    fieldErrors
  };
}

function formatResult(result) {
  return {
    lossRate: formatRatio(result.value.lossRate),
    purchaseAreaM2: formatMeasurement(result.value.purchaseAreaM2),
    hasBoxes: result.value.boxes !== null,
    boxes: result.value.boxes === null ? "" : formatInteger(result.value.boxes),
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

  onIrregularChange(event) {
    const update = invalidatedState(this.data.fieldErrors, "irregularRoom");
    update["form.irregularRoom"] = event.detail.value;
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

    const result = calculateFlooring(built.input);
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
      title: "装修计算工具 · 地板用量",
      path: "/pages/flooring/flooring"
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
