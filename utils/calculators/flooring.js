const {
  CONFIDENCE,
  FLOORING_IRREGULAR_INCREMENT,
  FLOORING_LOSS_RATES,
  FLOORING_MAX_AUTO_LOSS_RATE
} = require("./defaults");
const {
  success,
  validateBoolean,
  validateCalculatedValues,
  validateEnum,
  validateFiniteNumber,
  validateInputObject,
  validateOptionalPositiveNumber
} = require("./validation");

function calculateFlooring(input) {
  let error = validateInputObject(input);
  if (error) return error;

  error = validateFiniteNumber(input, "netAreaM2");
  if (error) return error;

  error = validateEnum(input, "layingMode", Object.keys(FLOORING_LOSS_RATES));
  if (error) return error;

  error = validateBoolean(input, "irregularRoom");
  if (error) return error;

  error = validateOptionalPositiveNumber(input, "boxCoverageM2");
  if (error) return error;

  const presetLossRate = FLOORING_LOSS_RATES[input.layingMode];
  const lossRate = Math.min(
    presetLossRate + (input.irregularRoom ? FLOORING_IRREGULAR_INCREMENT : 0),
    FLOORING_MAX_AUTO_LOSS_RATE
  );
  const purchaseAreaM2 = input.netAreaM2 * (1 + lossRate);
  error = validateCalculatedValues({ lossRate, purchaseAreaM2 });
  if (error) return error;

  let boxes = null;
  if (input.boxCoverageM2 !== undefined) {
    boxes = Math.ceil(purchaseAreaM2 / input.boxCoverageM2);
    error = validateCalculatedValues({ boxes });
    if (error) return error;
  }

  return success(
    "flooring",
    CONFIDENCE.FLOORING,
    {
      presetLossRate,
      lossRate,
      purchaseAreaM2,
      boxes
    },
    {
      presetLossRate: "ratio",
      lossRate: "ratio",
      purchaseAreaM2: "m2",
      boxes: "box"
    }
  );
}

module.exports = {
  calculateFlooring
};
