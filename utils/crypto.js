const crypto = require("crypto");
const getRndInt = (bytes) =>
  parseInt(
    parseInt(crypto.randomBytes(bytes).toString("hex"), 16).toString(10),
    10
  );

const getCSPRNG = (min, max) => {
  // validate
  if (min < 0) {
    return console.error("min must be at least 0");
  }
  if (min > max) {
    return console.error("min must be less than max");
  }
  let bytes;
  // choose the correct array type
  switch (true) {
    case max < 1:
      console.error("max must be at least 1");
      return;
    case max < 256: // 1-255
      bytes = 1;
      break;
    case max < 65536: // 256-65535
      bytes = 2; // default
      break;
    case max < 4294967296: // 65536-4294967295
      bytes = 4;
      break;
    default:
      console.error("max must be no more than 4294967295");
      return;
  }

  let randomNumber = getRndInt(bytes);
  let attempts = 1;
  while (randomNumber > max || randomNumber < min) {
    randomNumber = getRndInt(bytes); // retry until result is in range
    attempts++; // track failed generations
  }
  console.info({
    randomNumber,
    attempts,
  });
  return randomNumber;
};

const getCode = (length = 6) => {
  length--;
  return getCSPRNG(10 ** length, 10 ** length * 10 - 1);
};

module.exports = {
  getCode,
  getCSPRNG,
  getRndInt,
};
