const {
  CONFIDENCE,
  GROUT_DEFAULTS,
  WARNING_CODES
} = require("./defaults");
const {
  hasField,
  success,
  validateCalculatedValues,
  validateFiniteNumber,
  validateInputObject
} = require("./validation");
const {
  cubicMetersToMilliliters,
  millimetersToMeters
} = require("./units");

function calculateGrout(input) {
  let error = validateInputObject(input);
  if (error) return error;

  for (const field of [
    "areaM2",
    "tileLengthMm",
    "tileWidthMm",
    "jointWidthMm"
  ]) {
    error = validateFiniteNumber(input, field);
    if (error) return error;
  }

  if (hasField(input, "jointDepthMm")) {
    error = validateFiniteNumber(input, "jointDepthMm");
    if (error) return error;
  }

  const jointDepthMm = hasField(input, "jointDepthMm")
    ? input.jointDepthMm
    : GROUT_DEFAULTS.jointDepthMm;

  const tileLengthM = millimetersToMeters(input.tileLengthMm);
  const tileWidthM = millimetersToMeters(input.tileWidthMm);
  const jointWidthM = millimetersToMeters(input.jointWidthMm);
  const jointDepthM = millimetersToMeters(jointDepthMm);
  error = validateCalculatedValues({
    tileLengthM,
    tileWidthM,
    jointWidthM,
    jointDepthM
  });
  if (error) return error;

  const jointLengthPerM2 =
    (tileLengthM + tileWidthM) / (tileLengthM * tileWidthM);
  const totalJointLengthM = input.areaM2 * jointLengthPerM2;
  const volumeM3 = totalJointLengthM * jointWidthM * jointDepthM;
  const volumeMl = cubicMetersToMilliliters(volumeM3);
  error = validateCalculatedValues({
    jointLengthPerM2,
    totalJointLengthM,
    volumeM3,
    volumeMl
  });
  if (error) return error;

  return success(
    "grout",
    CONFIDENCE.GROUT,
    {
      tileLengthM,
      tileWidthM,
      jointWidthM,
      jointDepthM,
      jointLengthPerM2,
      totalJointLengthM,
      volumeM3,
      volumeMl
    },
    {
      tileLengthM: "m",
      tileWidthM: "m",
      jointWidthM: "m",
      jointDepthM: "m",
      jointLengthPerM2: "m_per_m2",
      totalJointLengthM: "m",
      volumeM3: "m3",
      volumeMl: "ml"
    },
    [{ code: WARNING_CODES.GROUT_REFERENCE_ONLY }]
  );
}

module.exports = {
  calculateGrout
};
