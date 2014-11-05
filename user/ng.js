var screen_names = [
  'string',
  /^re$/
];

var texts = [
  'ガンダム'
];

var sources = [
  'Ask.fm',
  /Tween/
];

var invalid = function () { return false; };

function make(lst) {
  return function (str) {
    var i, at;
    for (i = 0; i < lst.length; ++i) {
      at = lst[i];
      if (at.test) {
        if (at.test(str)) {
          return true;
        }
      } else {
        if (str.indexOf(at) !== -1) {
          return true;
        }
      }
    }
    return false;
  };
}

function re_screen_name() {
  return make(screen_names);
}

function re_text() {
  return make(texts);
}

function re_source() {
  return make(sources);
}

module.exports = {
  screen_name: re_screen_name(),
  text: re_text(),
  source: re_source()
};
