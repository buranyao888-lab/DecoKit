const {
  CONFIDENCE,
  ERROR_CODES,
  WARNING_CODES
} = require("./calculators/defaults");

const DECIMAL_PATTERN = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

const PARSE_ERROR_CODES = Object.freeze({
  MISSING: "UI_MISSING",
  INVALID_NUMBER: "UI_INVALID_NUMBER"
});

const CONFIDENCE_LABELS = Object.freeze({
  [CONFIDENCE.TILE]: "高可信度",
  [CONFIDENCE.PAINT]: "较高可信度",
  [CONFIDENCE.GROUT]: "参考估算",
  [CONFIDENCE.BUDGET]: "粗略估算"
});

const WARNING_MESSAGES = Object.freeze({
  [WARNING_CODES.GROUT_REFERENCE_ONLY]:
    "理论填充量仅供参考；实际用量受产品配比、残留和施工损耗影响，请以产品包装说明为准。",
  [WARNING_CODES.CURTAIN_HEIGHT_MEASUREMENT_REQUIRED]:
    "本工具只计算宽度。安装方式、挂钩、离地、缝边和面料缩水都会影响高度，请现场测量确认。",
  [WARNING_CODES.BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION]:
    "预算粗估，不是装修报价。"
});

const ERROR_MESSAGES = Object.freeze({
  [ERROR_CODES.INVALID_INPUT]: "页面数据无效，请检查输入后重试",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: "请填写此项",
  [ERROR_CODES.MISSING_BUDGET_COMPONENT]: "请填写该预算项目，金额可以为 0",
  [ERROR_CODES.INVALID_NUMBER]: "请输入有效数字",
  [ERROR_CODES.INVALID_BOOLEAN]: "请选择有效选项",
  [ERROR_CODES.INVALID_ENUM]: "请选择有效选项",
  [ERROR_CODES.CALCULATION_RANGE]: "输入数值过大，无法完成计算，请检查后重试"
});

function parseNumber(raw, required) {
  if (typeof raw !== "string") {
    return {
      ok: false,
      error: {
        code: PARSE_ERROR_CODES.INVALID_NUMBER,
        message: "请输入有效数字"
      }
    };
  }

  if (raw === "") {
    if (!required) {
      return { ok: true, omitted: true };
    }

    return {
      ok: false,
      error: {
        code: PARSE_ERROR_CODES.MISSING,
        message: "请填写此项"
      }
    };
  }

  if (!DECIMAL_PATTERN.test(raw)) {
    return {
      ok: false,
      error: {
        code: PARSE_ERROR_CODES.INVALID_NUMBER,
        message: "请输入有效数字"
      }
    };
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: {
        code: PARSE_ERROR_CODES.INVALID_NUMBER,
        message: "请输入有效数字"
      }
    };
  }

  return { ok: true, value };
}

function parseRequiredNumber(raw) {
  return parseNumber(raw, true);
}

function parseOptionalNumber(raw) {
  return parseNumber(raw, false);
}

function roundedString(value, maximumFractionDigits) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return Number(value.toFixed(maximumFractionDigits)).toString();
}

function formatInteger(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return value.toString();
}

function formatMeasurement(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  if (value > 0 && value < 0.01) {
    return "<0.01";
  }

  return roundedString(value, 2);
}

function formatRatio(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return `${roundedString(value * 100, 1)}%`;
}

function formatCurrency(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  const rounded = roundedString(value, 2);
  const parts = rounded.split(".");
  const negative = parts[0].startsWith("-");
  const digits = negative ? parts[0].slice(1) : parts[0];
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  parts[0] = negative ? `-${grouped}` : grouped;
  return parts.join(".");
}

function getConfidenceLabel(confidence) {
  return CONFIDENCE_LABELS[confidence] || "可信度未标注";
}

function getOutOfRangeMessage(details = {}) {
  if (details.constraint === "> 0") {
    return "请输入大于 0 的数值";
  }
  if (details.constraint === ">= 0") {
    return "请输入大于或等于 0 的数值";
  }
  if (details.constraint === "< grossWallAreaM2") {
    return "门窗洞口面积必须小于墙面总面积";
  }
  if (details.min !== undefined && details.max !== undefined) {
    return `请输入 ${details.min} 至 ${details.max} 范围内的数值`;
  }
  if (details.min !== undefined) {
    return `请输入不小于 ${details.min} 的数值`;
  }
  if (details.max !== undefined) {
    return `请输入不大于 ${details.max} 的数值`;
  }
  return "输入超出允许范围，请检查后重试";
}

function presentEngineError(error, inputFields = []) {
  const safeError = error && typeof error === "object" ? error : {};
  const code = safeError.code || "UNKNOWN_ERROR";
  const field = typeof safeError.field === "string" ? safeError.field : null;
  const message = code === ERROR_CODES.OUT_OF_RANGE
    ? getOutOfRangeMessage(safeError.details)
    : ERROR_MESSAGES[code] || "暂时无法完成计算，请检查输入后重试";

  return {
    code,
    field,
    message,
    level: field && inputFields.includes(field) ? "field" : "page"
  };
}

function presentWarnings(warnings) {
  if (!Array.isArray(warnings)) {
    return [];
  }

  return warnings.map(warning => {
    const code = warning && warning.code ? warning.code : "UNKNOWN_WARNING";
    return {
      code,
      message: WARNING_MESSAGES[code] || "计算完成，请结合实际情况确认结果。"
    };
  });
}

module.exports = {
  DECIMAL_PATTERN,
  PARSE_ERROR_CODES,
  formatCurrency,
  formatInteger,
  formatMeasurement,
  formatRatio,
  getConfidenceLabel,
  parseOptionalNumber,
  parseRequiredNumber,
  presentEngineError,
  presentWarnings
};
