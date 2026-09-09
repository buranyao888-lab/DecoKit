"use strict";

const CALCULATOR_KEYS = Object.freeze([
  "tile",
  "paint",
  "grout",
  "flooring",
  "curtain",
  "budget"
]);

function reportCalculationSuccess(calculatorKey) {
  if (!CALCULATOR_KEYS.includes(calculatorKey)) {
    return;
  }
  if (typeof wx === "undefined" || typeof wx.reportEvent !== "function") {
    return;
  }
  try {
    wx.reportEvent("calculation_success", { calculator: calculatorKey });
  } catch (_) {
    // Analytics is best-effort only. Never propagate analytics failures.
  }
}

module.exports = { reportCalculationSuccess };
