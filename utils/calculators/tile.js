const {
  CONFIDENCE,
  TILE_LOSS_RATES
} = require("./defaults");
const {
  success,
  validateCalculatedValues,
  validateEnum,
  validateFiniteNumber,
  validateInputObject,
  validateOptionalPositiveNumber
} = require("./validation");

const MERCHANT_DIFFERENCE_BANDS = Object.freeze({
  NORMAL_REFERENCE_RANGE: "NORMAL_REFERENCE_RANGE",
  SLIGHTLY_HIGH: "SLIGHTLY_HIGH",
  SIGNIFICANTLY_HIGH: "SIGNIFICANTLY_HIGH",
  LARGE_DIFFERENCE: "LARGE_DIFFERENCE"
});

function classifyMerchantDifference(merchantExcessRate) {
  if (merchantExcessRate <= 0.05) {
    return MERCHANT_DIFFERENCE_BANDS.NORMAL_REFERENCE_RANGE;
  }
  if (merchantExcessRate <= 0.1) {
    return MERCHANT_DIFFERENCE_BANDS.SLIGHTLY_HIGH;
  }
  if (merchantExcessRate <= 0.2) {
    return MERCHANT_DIFFERENCE_BANDS.SIGNIFICANTLY_HIGH;
  }
  return MERCHANT_DIFFERENCE_BANDS.LARGE_DIFFERENCE;
}

function calculateTile(input) {
  let error = validateInputObject(input);
  if (error) return error;

  for (const field of ["areaM2", "tileLengthMm", "tileWidthMm"]) {
    error = validateFiniteNumber(input, field);
    if (error) return error;
  }

  error = validateEnum(input, "layingMode", Object.keys(TILE_LOSS_RATES));
  if (error) return error;

  error = validateOptionalPositiveNumber(input, "piecesPerBox");
  if (error) return error;

  error = validateOptionalPositiveNumber(input, "merchantPieces");
  if (error) return error;

  const lossRate = TILE_LOSS_RATES[input.layingMode];
  const tileAreaM2 = input.tileLengthMm * input.tileWidthMm / 1_000_000;
  error = validateCalculatedValues({ tileAreaM2 });
  if (error) return error;

  const theoreticalPieces = Math.ceil(input.areaM2 / tileAreaM2);
  error = validateCalculatedValues({ theoreticalPieces });
  if (error) return error;

  // This is algebraically identical to theoreticalPieces * (1 + lossRate),
  // while preserving exact integer percentage boundaries for the frozen presets.
  const piecesWithLoss = theoreticalPieces * (100 + lossRate * 100) / 100;
  const recommendedPieces = Math.ceil(piecesWithLoss);
  error = validateCalculatedValues({ piecesWithLoss, recommendedPieces });
  if (error) return error;

  let boxes = null;
  if (input.piecesPerBox !== undefined) {
    boxes = Math.ceil(recommendedPieces / input.piecesPerBox);
    error = validateCalculatedValues({ boxes });
    if (error) return error;
  }

  const value = {
    tileAreaM2,
    theoreticalPieces,
    lossRate,
    recommendedPieces,
    boxes
  };

  if (input.merchantPieces !== undefined) {
    const merchantExcessRate =
      (input.merchantPieces - recommendedPieces) / recommendedPieces;
    error = validateCalculatedValues({ merchantExcessRate });
    if (error) return error;

    value.merchantExcessRate = merchantExcessRate;
    value.merchantDifferenceBand = classifyMerchantDifference(merchantExcessRate);
  }

  return success(
    "tile",
    CONFIDENCE.TILE,
    value,
    {
      tileAreaM2: "m2",
      theoreticalPieces: "piece",
      lossRate: "ratio",
      recommendedPieces: "piece",
      boxes: "box",
      merchantExcessRate: "ratio"
    }
  );
}

module.exports = {
  calculateTile,
  MERCHANT_DIFFERENCE_BANDS
};
