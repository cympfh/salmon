ids = [
  'this_is_test_user'
]; // empty => everything

exports.ids = new RegExp(ids.join('|'));
