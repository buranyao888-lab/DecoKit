const { calculateCurtain } = require("../../utils/calculators/index.js");
const {
  CURTAIN_DEFAULTS,
  CURTAIN_FULLNESS_VALUES,
  CURTAIN_PANEL_VALUES
} = require("../../utils/calculators/defaults");
const {
  formatMeasurement,
  getConfidenceLabel,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");

const INPUT_FIELDS = Object.freeze(["trackWidthM", "fullness", "panels"]);

function createInitialData() {
  return {
    form: {
      trackWidthM: "",
      fullness: CURTAIN_DEFAULTS.fullness,
      panels: CURTAIN_DEFAULTS.panels
    },
    defaultFullness: CURTAIN_DEFAULTS.fullness,
    defaultPanels: CURTAIN_DEFAULTS.panels,
    fullnessOptions: CURTAIN_FULLNESS_VALUES.map(value => ({
      value,
      label: value === CURTAIN_DEFAULTS.fullness ? `${value} 倍 · 标准` : `${value} 倍`
    })),
    panelOptions: CURTAIN_PANEL_VALUES.map(value => ({
      value,
      label: `${value} 片`
    })),
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
  const trackWidth = parseRequiredNumber(form.trackWidthM);
  if (!trackWidth.ok) {
    return {
      ok: false,
      input: {},
      fieldErrors: { trackWidthM: trackWidth.error.message }
    };
  }

  return {
    ok: true,
    input: {
      trackWidthM: trackWidth.value,
      fullness: form.fullness,
      panels: form.panels
    },
    fieldErrors: {}
  };
}

function formatResult(result) {
  return {
    totalFinishedWidthM: formatMeasurement(result.value.totalFinishedWidthM),
    singlePanelWidthM: formatMeasurement(result.value.singlePanelWidthM),
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

  selectFullness(event) {
    const option = this.data.fullnessOptions[event.currentTarget.dataset.index];
    const update = invalidatedState(this.data.fieldErrors, "fullness");
    update["form.fullness"] = option.value;
    this.setData(update);
  },

  selectPanels(event) {
    const option = this.data.panelOptions[event.currentTarget.dataset.index];
    const update = invalidatedState(this.data.fieldErrors, "panels");
    update["form.panels"] = option.value;
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

    const result = calculateCurtain(built.input);
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
      title: "装修计算工具 · 窗帘宽度",
      path: "/pages/curtain/curtain"
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
