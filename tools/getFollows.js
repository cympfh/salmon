#!/usr/bin/env node

/*
 * 使用制限アリのAPI
 * https://dev.twitter.com/docs/api/1.1/get/friends/list
*/

var twitter = require("ntwitter")
  , setting = require("../../setting.json")
  , users = setting.users
  ;

var tw;
for (var u in users) {
  tw = make_twitter(u);

  console.log(u);
  getFollows(tw);

}

function getFollows(tw) {
  function loop(cur) {
    var options = { count : "200" };
    options['cursor'] = cur;
    tw.get(
        "https://api.twitter.com/1.1/friends/list.json",
        options,
        function(err, data) {
          if (err) {
            console.log(err);
            process.exit(1);
          }
          var next = data.next_cursor_str;

          console.log(data.users.map(function(o){return o.screen_name}).join('\n'));
          console.warn(next);

          if (next === '0') { // END
            return;
          }
          return loop(next);
        });
  }
  loop(-1);
}

function make_twitter(name) {
  var u = users[name];
  return new twitter({
    consumer_key        : u.consumer_key,
    consumer_secret     : u.consumer_secret,
    access_token_key    : u.access_token_key,
    access_token_secret : u.access_token_secret,
  });
}

