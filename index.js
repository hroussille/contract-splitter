module.exports = function (input) {
  input = input.toLowerCase().replace("0x", "");

  // Look for a special pattern of contract deployement tx present at the end of the constructor bytecode
  // 0x5B JUMPDEST (OPTIONAL)
  // 0x60 PUSH1 / 0x61 PUSH2 / 0x62 PUSH3 : This is the contract bytecode length
  // 0x80 DUP1
  // 0x60 PUSH1 / 0x61 PUSH2 / 0x62 PUSH3 : This the the contract bytecode offset
  // 0x60 0x00 PUSH1 (0)
  // 0x39 CODECOPY
  // 0x60 0x00 PUSH1 (0)
  // 0xF3 RETURN
  // 0xFE INVALID
  const CODECOPY_REGEX =
    /(?:5b)?(?:60([a-z0-9]{2})|61([a-z0-9_]{4})|62([a-z0-9_]{6}))80(?:60([a-z0-9]{2})|61([a-z0-9_]{4})|62([a-z0-9_]{6}))6000396000f3fe/gm;

  m = CODECOPY_REGEX.exec(input);

  if (m == null || m == undefined) {
    throw Error("Input is not a standard deployement bytecode");
  }

  const CONSTRUCTOR_OFFSET = 0;
  const CONTRACT_LENGTH = parseInt(m[1] || m[2] || m[3], 16) * 2;
  const CONTRACT_OFFSET = parseInt(m[4] || m[5] || m[6], 16) * 2;

  // Also get embedded metadata from the contract's code : located at the end of it
  const METADATA_LENGTH =
    parseInt(
      input.slice(
        CONTRACT_OFFSET + CONTRACT_LENGTH - 4,
        CONTRACT_OFFSET + CONTRACT_LENGTH
      ),
      16
    ) *
      2 +
    4;

  return {
    constructor: input.slice(CONSTRUCTOR_OFFSET, CONTRACT_OFFSET),
    contract: input.slice(CONTRACT_OFFSET, CONTRACT_OFFSET + CONTRACT_LENGTH),
    metadata: input.slice(
      CONTRACT_OFFSET + CONTRACT_LENGTH - METADATA_LENGTH,
      CONTRACT_OFFSET + CONTRACT_LENGTH
    ),
    arguments: input.slice(CONTRACT_OFFSET + CONTRACT_LENGTH),
  };
};
