var exec = require('child_process').exec;

module.exports = function(OS) {

  var file = __filename.slice(0, __filename.lastIndexOf('/'))
    , command = (OS==='LINUX' ? 'play' : 'afplay -v') + ' ' + file

  return function () { exec(command, function(){}); };

};
