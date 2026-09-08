const { calculateBudget } = require("../../utils/calculators/index.js");
const { BUDGET_COMPONENTS } = require("../../utils/calculators/defaults");
const {
  formatCurrency,
  getConfidenceLabel,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
} = require("../../utils/calculator-ui");

function emptyBudgetForm() {
  return BUDGET_COMPONENTS.reduce((form, field) => {
    form[field] = "";
    return form;
  }, {});
}

function createInitialData() {
  return {
    form: emptyBudgetForm(),
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
  const input = {};
  const fieldErrors = {};

  for (const field of BUDGET_COMPONENTS) {
    const parsed = parseRequiredNumber(form[field]);
    if (!parsed.ok) {
      fieldErrors[field] = parsed.error.message;
    } else {
      input[field] = parsed.value;
    }
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    input,
    fieldErrors
  };
}

function formatResult(result) {
  return {
    totalBudget: formatCurrency(result.value.totalBudget),
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

    const result = calculateBudget(built.input);
    if (!result.ok) {
      const error = presentEngineError(result.error, BUDGET_COMPONENTS);
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
      title: "装修计算工具 · 装修预算粗估",
      path: "/pages/budget/budget"
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
