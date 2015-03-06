var esc = String.fromCharCode(27);

function make(n) {
  return function (str) {
    return esc + '[' + n + 'm' + str + esc + '[m';
  };
}

var Font = {
  esc: esc,
  red: make(31),
  cyan: make(36),
  gray: make(37),
  brown: make(33),
  blue: make(34),
  light_green: make(92),
  underline: make(4)
};

module.exports = Font;
