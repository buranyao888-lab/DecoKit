const test = require("node:test");
const assert = require("node:assert/strict");

const {
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
} = require("../../utils/calculator-ui");

test("required parser distinguishes an empty value", () => {
  const result = parseRequiredNumber("");
  assert.equal(result.ok, false);
  assert.equal(result.error.code, PARSE_ERROR_CODES.MISSING);
  assert.equal(result.error.message, "请填写此项");
});

test("required parser accepts the frozen decimal forms", () => {
  const cases = [
    ["12", 12],
    ["12.5", 12.5],
    ["0", 0],
    ["-1", -1],
    ["0.5", 0.5],
    [".5", 0.5],
    ["-.5", -0.5]
  ];

  for (const [raw, value] of cases) {
    assert.deepEqual(parseRequiredNumber(raw), { ok: true, value }, raw);
  }
});

test("required parser rejects whitespace and non-decimal JavaScript syntax", () => {
  const invalidValues = [
    " ",
    " 12",
    "12 ",
    "1e3",
    "NaN",
    "Infinity",
    "-Infinity",
    "0x10",
    "1,000",
    "12mm",
    "1.2.3",
    "+1",
    "1."
  ];

  for (const raw of invalidValues) {
    const result = parseRequiredNumber(raw);
    assert.equal(result.ok, false, raw);
    assert.equal(result.error.code, PARSE_ERROR_CODES.INVALID_NUMBER, raw);
  }
});

test("parser rejects non-string input and non-finite decimal overflow", () => {
  assert.equal(parseRequiredNumber(12).error.code, PARSE_ERROR_CODES.INVALID_NUMBER);
  const overflowingDecimal = "9".repeat(400);
  assert.equal(
    parseRequiredNumber(overflowingDecimal).error.code,
    PARSE_ERROR_CODES.INVALID_NUMBER
  );
});

test("optional parser omits only an exact empty string", () => {
  assert.deepEqual(parseOptionalNumber(""), { ok: true, omitted: true });
  assert.deepEqual(parseOptionalNumber("0"), { ok: true, value: 0 });
  assert.deepEqual(parseOptionalNumber("2.5"), { ok: true, value: 2.5 });
  assert.equal(parseOptionalNumber(" ").ok, false);
});

test("integer formatting preserves Calculator integer values", () => {
  assert.equal(formatInteger(30), "30");
  assert.equal(formatInteger(Number.POSITIVE_INFINITY), "—");
});

test("measurement formatting limits decimals and removes trailing zeros", () => {
  assert.equal(formatMeasurement(12.345), "12.35");
  assert.equal(formatMeasurement(12.3), "12.3");
  assert.equal(formatMeasurement(12), "12");
});

test("measurement formatting identifies tiny positive values", () => {
  assert.equal(formatMeasurement(0.009), "<0.01");
  assert.equal(formatMeasurement(0), "0");
});

test("ratio formatting uses a percentage and preserves negatives", () => {
  assert.equal(formatRatio(0.175), "17.5%");
  assert.equal(formatRatio(0.1), "10%");
  assert.equal(formatRatio(-0.056), "-5.6%");
});

test("currency formatting groups thousands and removes trailing zeros", () => {
  assert.equal(formatCurrency(1234567.5), "1,234,567.5");
  assert.equal(formatCurrency(1000), "1,000");
  assert.equal(formatCurrency(12.345), "12.35");
  assert.equal(formatCurrency(-1200.5), "-1,200.5");
});

test("confidence mapping covers every frozen value", () => {
  assert.equal(getConfidenceLabel("high"), "高可信度");
  assert.equal(getConfidenceLabel("medium_high"), "较高可信度");
  assert.equal(getConfidenceLabel("reference"), "参考估算");
  assert.equal(getConfidenceLabel("rough"), "粗略估算");
  assert.equal(getConfidenceLabel("unknown"), "可信度未标注");
});

test("warning mapping covers frozen warning codes without blocking results", () => {
  const warnings = presentWarnings([
    { code: "GROUT_REFERENCE_ONLY" },
    { code: "CURTAIN_HEIGHT_MEASUREMENT_REQUIRED" },
    { code: "BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION" }
  ]);

  assert.deepEqual(warnings.map(item => item.code), [
    "GROUT_REFERENCE_ONLY",
    "CURTAIN_HEIGHT_MEASUREMENT_REQUIRED",
    "BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION"
  ]);
  assert.match(warnings[0].message, /理论填充量仅供参考/);
  assert.match(warnings[1].message, /只计算宽度/);
  assert.equal(warnings[2].message, "预算粗估，不是装修报价。");
});

test("unknown warnings retain their code and receive a neutral fallback", () => {
  assert.deepEqual(presentWarnings([{ code: "FUTURE_WARNING" }]), [
    {
      code: "FUTURE_WARNING",
      message: "计算完成，请结合实际情况确认结果。"
    }
  ]);
  assert.deepEqual(presentWarnings(undefined), []);
});

test("error mapping covers every frozen basic code", () => {
  const expected = {
    INVALID_INPUT: "页面数据无效，请检查输入后重试",
    MISSING_REQUIRED_FIELD: "请填写此项",
    MISSING_BUDGET_COMPONENT: "请填写该预算项目，金额可以为 0",
    INVALID_NUMBER: "请输入有效数字",
    INVALID_BOOLEAN: "请选择有效选项",
    INVALID_ENUM: "请选择有效选项",
    CALCULATION_RANGE: "输入数值过大，无法完成计算，请检查后重试"
  };

  for (const [code, message] of Object.entries(expected)) {
    assert.equal(presentEngineError({ code }).message, message, code);
  }
});

test("range errors use only existing Engine details", () => {
  assert.equal(
    presentEngineError({ code: "OUT_OF_RANGE", details: { constraint: "> 0" } }).message,
    "请输入大于 0 的数值"
  );
  assert.equal(
    presentEngineError({ code: "OUT_OF_RANGE", details: { constraint: ">= 0" } }).message,
    "请输入大于或等于 0 的数值"
  );
  assert.equal(
    presentEngineError({
      code: "OUT_OF_RANGE",
      details: { constraint: "< grossWallAreaM2" }
    }).message,
    "门窗洞口面积必须小于墙面总面积"
  );
  assert.equal(
    presentEngineError({ code: "OUT_OF_RANGE", details: { min: 10, max: 16 } }).message,
    "请输入 10 至 16 范围内的数值"
  );
});

test("error mapping selects field and page presentation levels", () => {
  const fieldError = presentEngineError(
    { code: "INVALID_NUMBER", field: "areaM2", details: {} },
    ["areaM2"]
  );
  const pageError = presentEngineError(
    { code: "CALCULATION_RANGE", field: "recommendedPieces", details: {} },
    ["areaM2"]
  );

  assert.equal(fieldError.level, "field");
  assert.equal(fieldError.code, "INVALID_NUMBER");
  assert.equal(pageError.level, "page");
  assert.equal(pageError.code, "CALCULATION_RANGE");
});

test("unknown errors retain their code and receive a page fallback", () => {
  assert.deepEqual(presentEngineError({ code: "FUTURE_ERROR" }), {
    code: "FUTURE_ERROR",
    field: null,
    message: "暂时无法完成计算，请检查输入后重试",
    level: "page"
  });
});
