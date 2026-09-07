const { ERROR_CODES } = require("./defaults");

function failure(code, field = null, details = {}) {
  return {
    ok: false,
    error: {
      code,
      field,
      details
    }
  };
}

function success(calculator, confidence, value, units, warnings = [], metadata) {
  const meta = {
    calculator,
    confidence,
    units,
    warnings
  };

  if (metadata !== undefined) {
    meta.metadata = metadata;
  }

  return {
    ok: true,
    value,
    meta
  };
}

function validateInputObject(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return failure(ERROR_CODES.INVALID_INPUT, null);
  }

  return null;
}

function hasField(input, field) {
  return Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined;
}

function validateFiniteNumber(input, field, options = {}) {
  if (!hasField(input, field)) {
    return failure(options.missingCode || ERROR_CODES.MISSING_REQUIRED_FIELD, field);
  }

  const value = input[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return failure(ERROR_CODES.INVALID_NUMBER, field);
  }

  if (options.allowZero ? value < 0 : value <= 0) {
    return failure(ERROR_CODES.OUT_OF_RANGE, field, {
      constraint: options.allowZero ? ">= 0" : "> 0"
    });
  }

  if (options.min !== undefined && value < options.min) {
    return failure(ERROR_CODES.OUT_OF_RANGE, field, {
      min: options.min,
      max: options.max
    });
  }

  if (options.max !== undefined && value > options.max) {
    return failure(ERROR_CODES.OUT_OF_RANGE, field, {
      min: options.min,
      max: options.max
    });
  }

  return null;
}

function validateOptionalPositiveNumber(input, field) {
  if (!hasField(input, field)) {
    return null;
  }

  return validateFiniteNumber(input, field);
}

function validateBoolean(input, field) {
  if (!hasField(input, field)) {
    return failure(ERROR_CODES.MISSING_REQUIRED_FIELD, field);
  }

  if (typeof input[field] !== "boolean") {
    return failure(ERROR_CODES.INVALID_BOOLEAN, field);
  }

  return null;
}

function validateEnum(input, field, allowedValues) {
  if (!hasField(input, field)) {
    return failure(ERROR_CODES.MISSING_REQUIRED_FIELD, field);
  }

  if (!allowedValues.includes(input[field])) {
    return failure(ERROR_CODES.INVALID_ENUM, field, {
      allowedValues: allowedValues.slice()
    });
  }

  return null;
}

function validateCalculatedValues(values) {
  for (const [field, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return failure(ERROR_CODES.CALCULATION_RANGE, field);
    }
  }

  return null;
}

module.exports = {
  failure,
  hasField,
  success,
  validateBoolean,
  validateCalculatedValues,
  validateEnum,
  validateFiniteNumber,
  validateInputObject,
  validateOptionalPositiveNumber
};
