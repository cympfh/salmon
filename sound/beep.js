var exec = require('child_process').exec
  , OS = process.env.TERM_PROGRAM ? 'MAC' : 'LINUX'
  , command = OS === 'MAC' ? 'afplay -v' : 'play'
  , file = './sound/catch.oga'
;

module.exports = function() {
  exec(command + ' ' + file, function(){});
};
