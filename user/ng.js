namespace = module.exports = {};

namespace.ids = [
  'asterisk37n',
  'lll_anna_lll',
  'hirokyun'
];

function compile_id() {
  var ids = namespace.ids;
  if (ids.length === 0) {
    return /$./;
  }
  return new RegExp(ids.join('|'));
}

function add_id(id) {
  namespace.ids.push(id);
  namespace.re_id = compile_id();
}

// EXPORT
namespace.re_id = compile_id();
namespace.compile_id = compile_id;
namespace.add_id = add_id;
