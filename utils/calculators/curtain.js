const {
  CONFIDENCE,
  CURTAIN_DEFAULTS,
  CURTAIN_FULLNESS_VALUES,
  CURTAIN_PANEL_VALUES,
  WARNING_CODES
} = require("./defaults");
const {
  hasField,
  success,
  validateCalculatedValues,
  validateEnum,
  validateFiniteNumber,
  validateInputObject
} = require("./validation");

function calculateCurtain(input) {
  let error = validateInputObject(input);
  if (error) return error;

  error = validateFiniteNumber(input, "trackWidthM");
  if (error) return error;

  const fullness = hasField(input, "fullness")
    ? input.fullness
    : CURTAIN_DEFAULTS.fullness;
  if (hasField(input, "fullness")) {
    error = validateFiniteNumber(input, "fullness");
    if (error) return error;
    error = validateEnum(input, "fullness", CURTAIN_FULLNESS_VALUES);
    if (error) return error;
  }

  const panels = hasField(input, "panels")
    ? input.panels
    : CURTAIN_DEFAULTS.panels;
  if (hasField(input, "panels")) {
    error = validateFiniteNumber(input, "panels");
    if (error) return error;
    error = validateEnum(input, "panels", CURTAIN_PANEL_VALUES);
    if (error) return error;
  }

  const totalFinishedWidthM = input.trackWidthM * fullness;
  const singlePanelWidthM = totalFinishedWidthM / panels;
  error = validateCalculatedValues({ totalFinishedWidthM, singlePanelWidthM });
  if (error) return error;

  return success(
    "curtain",
    CONFIDENCE.CURTAIN,
    {
      fullness,
      panels,
      totalFinishedWidthM,
      singlePanelWidthM
    },
    {
      fullness: "ratio",
      panels: "panel",
      totalFinishedWidthM: "m",
      singlePanelWidthM: "m"
    },
    [{ code: WARNING_CODES.CURTAIN_HEIGHT_MEASUREMENT_REQUIRED }]
  );
}

module.exports = {
  calculateCurtain
};
