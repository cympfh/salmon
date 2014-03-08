var exec = require('child_process').exec;

module.exports = function(OS) {

  var command =
    OS==='LINUX' ? "play /usr/share/sounds/linuxmint-gdm.wav"
                 : "afplay -v 5 /System/Library/Sounds/Pop.aiff";

  return function () {
    exec(command, function(){});
  };

};
