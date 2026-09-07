const {
  BUDGET_COMPONENTS,
  BUDGET_METADATA_FIELDS,
  CONFIDENCE,
  ERROR_CODES,
  WARNING_CODES
} = require("./defaults");
const {
  failure,
  hasField,
  success,
  validateCalculatedValues,
  validateFiniteNumber,
  validateInputObject
} = require("./validation");

function calculateBudget(input) {
  let error = validateInputObject(input);
  if (error) return error;

  for (const field of BUDGET_COMPONENTS) {
    if (!hasField(input, field)) {
      return failure(ERROR_CODES.MISSING_BUDGET_COMPONENT, field);
    }

    error = validateFiniteNumber(input, field, { allowZero: true });
    if (error) return error;
  }

  const totalBudget = BUDGET_COMPONENTS.reduce(
    (total, field) => total + input[field],
    0
  );
  error = validateCalculatedValues({ totalBudget });
  if (error) return error;

  const metadata = {};
  for (const field of BUDGET_METADATA_FIELDS) {
    if (hasField(input, field)) {
      metadata[field] = input[field];
    }
  }

  return success(
    "budget",
    CONFIDENCE.BUDGET,
    { totalBudget },
    { totalBudget: "currency_amount" },
    [{ code: WARNING_CODES.BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION }],
    Object.keys(metadata).length > 0 ? metadata : undefined
  );
}

module.exports = {
  calculateBudget
};
