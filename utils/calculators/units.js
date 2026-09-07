function millimetersToMeters(valueMm) {
  return valueMm / 1000;
}

function cubicMetersToMilliliters(valueM3) {
  return valueM3 * 1_000_000;
}

module.exports = {
  cubicMetersToMilliliters,
  millimetersToMeters
};
