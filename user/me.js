var mines = [
  'cympfh', 'ampeloss', 'cympfh_out', 'qaugh'
];

function is_me(username) {
  var i, n = mines.length;
  for (i = 0; i < n; ++i) {
    if (mines[i] === username) { return true; }
  }
  return false;
}

function is_reply(text) {
  var i, n = mines.length;
  for (i = 0; i < n; ++i) {
    if (text.indexOf(mines[i]) !== -1) { return true; }
  }
  return (/枚方|まいかた|ひららら|いらいざ|イライザ/.test(text));
}

module.exports = {
  is_me: is_me,
  is_reply: is_reply
};
