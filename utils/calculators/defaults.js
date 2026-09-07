const CONFIDENCE = Object.freeze({
  TILE: "high",
  PAINT: "medium_high",
  FLOORING: "medium_high",
  GROUT: "reference",
  CURTAIN: "medium_high",
  BUDGET: "rough"
});

const TILE_LOSS_RATES = Object.freeze({
  straight: 0.05,
  staggered: 0.08,
  complex: 0.1
});

const PAINT_DEFAULTS = Object.freeze({
  coverageM2PerLPerCoat: 13,
  coatCount: 2,
  reserveRate: 0.1,
  primerCoverage: 11,
  primerCoats: 1,
  primerReserveRate: 0.1
});

const PAINT_FACE_LIMITS = Object.freeze({
  coverageM2PerLPerCoat: Object.freeze({ min: 10, max: 16 }),
  coatCount: Object.freeze({ min: 1, max: 3 }),
  reserveRate: Object.freeze({ min: 0, max: 0.2 })
});

const FLOORING_LOSS_RATES = Object.freeze({
  straight: 0.05,
  staggered: 0.08,
  herringbone: 0.15
});

const FLOORING_IRREGULAR_INCREMENT = 0.02;
const FLOORING_MAX_AUTO_LOSS_RATE = 0.2;

const GROUT_DEFAULTS = Object.freeze({
  jointDepthMm: 3
});

const CURTAIN_DEFAULTS = Object.freeze({
  fullness: 1.8,
  panels: 2
});

const CURTAIN_FULLNESS_VALUES = Object.freeze([1.5, 1.8, 2]);
const CURTAIN_PANEL_VALUES = Object.freeze([1, 2]);

const BUDGET_COMPONENTS = Object.freeze([
  "baseConstruction",
  "plumbingElectrical",
  "masonry",
  "carpentry",
  "painting",
  "mainMaterials",
  "customization",
  "kitchenBathroom",
  "installation",
  "contingency"
]);

const BUDGET_METADATA_FIELDS = Object.freeze([
  "version",
  "city",
  "level",
  "updated_at",
  "source"
]);

const WARNING_CODES = Object.freeze({
  GROUT_REFERENCE_ONLY: "GROUT_REFERENCE_ONLY",
  CURTAIN_HEIGHT_MEASUREMENT_REQUIRED: "CURTAIN_HEIGHT_MEASUREMENT_REQUIRED",
  BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION: "BUDGET_ROUGH_ESTIMATE_NOT_QUOTATION"
});

const ERROR_CODES = Object.freeze({
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  MISSING_BUDGET_COMPONENT: "MISSING_BUDGET_COMPONENT",
  INVALID_NUMBER: "INVALID_NUMBER",
  INVALID_BOOLEAN: "INVALID_BOOLEAN",
  INVALID_ENUM: "INVALID_ENUM",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  CALCULATION_RANGE: "CALCULATION_RANGE"
});

module.exports = {
  BUDGET_COMPONENTS,
  BUDGET_METADATA_FIELDS,
  CONFIDENCE,
  CURTAIN_DEFAULTS,
  CURTAIN_FULLNESS_VALUES,
  CURTAIN_PANEL_VALUES,
  ERROR_CODES,
  FLOORING_IRREGULAR_INCREMENT,
  FLOORING_LOSS_RATES,
  FLOORING_MAX_AUTO_LOSS_RATE,
  GROUT_DEFAULTS,
  PAINT_DEFAULTS,
  PAINT_FACE_LIMITS,
  TILE_LOSS_RATES,
  WARNING_CODES
};
