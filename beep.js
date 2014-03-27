var exec = require('child_process').exec;

module.exports = function(OS) {

  var file = process.env.HOME + '/Dropbox/node/salmon/catch.oga'
    , command = (OS==='LINUX' ? 'play' : 'afplay -v') + ' ' + file

  return function () { exec(command, function(){}); };

};
