const {
  CONFIDENCE,
  ERROR_CODES,
  PAINT_DEFAULTS,
  PAINT_FACE_LIMITS
} = require("./defaults");
const {
  failure,
  hasField,
  success,
  validateBoolean,
  validateCalculatedValues,
  validateEnum,
  validateFiniteNumber,
  validateInputObject
} = require("./validation");

const PAINT_MODES = Object.freeze(["direct", "assisted"]);

function resolveFaceParameter(input, field) {
  if (!hasField(input, field)) {
    return { value: PAINT_DEFAULTS[field] };
  }

  const limits = PAINT_FACE_LIMITS[field];
  const error = validateFiniteNumber(input, field, {
    allowZero: limits.min === 0,
    min: limits.min,
    max: limits.max
  });

  return error ? { error } : { value: input[field] };
}

function calculatePaint(input) {
  let error = validateInputObject(input);
  if (error) return error;

  error = validateEnum(input, "mode", PAINT_MODES);
  if (error) return error;

  let paintAreaM2;
  let grossWallAreaM2;
  let wallNetArea;

  if (input.mode === "direct") {
    error = validateFiniteNumber(input, "paintAreaM2");
    if (error) return error;
    paintAreaM2 = input.paintAreaM2;
  } else {
    for (const field of ["perimeterM", "heightM"]) {
      error = validateFiniteNumber(input, field);
      if (error) return error;
    }

    error = validateFiniteNumber(input, "openingsAreaM2", { allowZero: true });
    if (error) return error;

    error = validateBoolean(input, "includeCeiling");
    if (error) return error;

    if (input.includeCeiling) {
      error = validateFiniteNumber(input, "ceilingAreaM2");
      if (error) return error;
    }

    grossWallAreaM2 = input.perimeterM * input.heightM;
    error = validateCalculatedValues({ grossWallAreaM2 });
    if (error) return error;

    if (input.openingsAreaM2 >= grossWallAreaM2) {
      return failure(ERROR_CODES.OUT_OF_RANGE, "openingsAreaM2", {
        constraint: "< grossWallAreaM2"
      });
    }

    wallNetArea = grossWallAreaM2 - input.openingsAreaM2;
    paintAreaM2 = wallNetArea + (input.includeCeiling ? input.ceilingAreaM2 : 0);
    error = validateCalculatedValues({ wallNetArea, paintAreaM2 });
    if (error) return error;
  }

  const coverage = resolveFaceParameter(input, "coverageM2PerLPerCoat");
  if (coverage.error) return coverage.error;
  const coats = resolveFaceParameter(input, "coatCount");
  if (coats.error) return coats.error;
  const reserve = resolveFaceParameter(input, "reserveRate");
  if (reserve.error) return reserve.error;

  const facePaintLiters =
    paintAreaM2 * coats.value / coverage.value * (1 + reserve.value);
  const primerLiters =
    paintAreaM2 * PAINT_DEFAULTS.primerCoats /
    PAINT_DEFAULTS.primerCoverage *
    (1 + PAINT_DEFAULTS.primerReserveRate);

  error = validateCalculatedValues({ facePaintLiters, primerLiters });
  if (error) return error;

  const value = {
    paintAreaM2,
    coverageM2PerLPerCoat: coverage.value,
    coatCount: coats.value,
    reserveRate: reserve.value,
    facePaintLiters,
    primerCoverage: PAINT_DEFAULTS.primerCoverage,
    primerCoats: PAINT_DEFAULTS.primerCoats,
    primerReserveRate: PAINT_DEFAULTS.primerReserveRate,
    primerLiters
  };

  if (input.mode === "assisted") {
    value.grossWallAreaM2 = grossWallAreaM2;
    value.wallNetArea = wallNetArea;
  }

  return success(
    "paint",
    CONFIDENCE.PAINT,
    value,
    {
      paintAreaM2: "m2",
      coverageM2PerLPerCoat: "m2_per_liter_per_coat",
      coatCount: "coat",
      reserveRate: "ratio",
      facePaintLiters: "liter",
      primerCoverage: "m2_per_liter_per_coat",
      primerCoats: "coat",
      primerReserveRate: "ratio",
      primerLiters: "liter",
      grossWallAreaM2: "m2",
      wallNetArea: "m2"
    }
  );
}

module.exports = {
  calculatePaint,
  PAINT_MODES
};
