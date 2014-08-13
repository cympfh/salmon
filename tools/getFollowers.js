#!/usr/bin/env node

/*
 * https://dev.twitter.com/docs/api/1.1/get/followers/list
 * https://api.twitter.com/1.1/followers/list.json 
*/

id = process.argv[2];
if (!id) {
  console.warn("usage: node %s [your TwitterID]", process.argv[1]);
  process.exit(0);
}

var twitter = require("ntwitter")
  , setting = require("../../setting.json")
  , me = setting.users[id]
  , tw = new twitter(me)
  ;

(function rec(cur) {
  var options = { count : "200" };
  options['cursor'] = cur;
  tw.get(
      "https://api.twitter.com/1.1/followers/list.json",
      options,
      function(err, data) {
        if (err) {
          console.log(err);
          process.exit(1);
        }
        var next = data.next_cursor_str;

        console.log(data.users.map(function(o){return o.screen_name}).join('\n'));

        if (next === '0') { // END
          return;
        }
        return rec(next);
      });
}(-1));
