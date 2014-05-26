
function make(n) {
  var esc = String.fromCharCode(27);
  return function(str) {
    return esc + '[' + n + 'm' + str + esc + '[m';
  };
}

var Font = {
    red : make(31)
  , cyan: make(36)
  , gray: make(37)
  , brown: make(33)
  , underline: make(4)
};

module.exports = Font;
