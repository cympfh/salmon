var child   = require('child_process');
var fs      = require('fs');
var Twitter = require('ntwitter');
var setting = require('../setting.json');
var URL   = require('./lib/urls');
var users = setting.users;
var beep  = require('./sound/beep');
var font  = require('./lib/font');

var delete_after_fav = false;

// ---------- parse args

(function() {
  var i, a;
  for (i=2; i<process.argv.length; ++i) {
    a = process.argv[i];
    if (a === "-F") {
      delete_after_fav = true;
    }
  }
}());

// --------------  util

var util = require('./lib/util');
var timezone = util.timezone;
var source_trim = util.source_trim;
var hash = util.hash;

// -------------- config
var NG    = require('./user/ng');
var me    = require('./user/me');

var recently_tw_size = 6;
var delete_lag = 3 * 60 * 60000; // 3 hr

// stack
var replies = [];
var favs = [];
var recently_tw = [];
var recentlyMyTw = [];
var followedBy = [];

var tw_buf = '';
var screen_buf = '';
var footer = '';

var mode = 'stream'; // repl | stream | insert | lineInsert | command

var last_status_id = [];
var last_search_word = '';
var lastID = [];

var tw = {};
var current_user;

var it, lasterr;

// ---------------- buffer

function put_str(text) {
  if (mode === 'stream') {
    console.log(text);
  } else {
    screen_buf += text + "\n";
  }
}

// ----------------- twitter

function post_to_twitter(msg) {

  function post(u, messaging) {
    if (!tw.hasOwnProperty(u)) {
      console.log("err : " + u + " not in tw");
      return;
    }
    var url = "https://api.twitter.com/1.1/statuses/update.json";
    tw[u].post(url, messaging, function (er) { if (er) { console.log(er); } });
  }

  function dub(msg) {
    var idx;
    while (recentlyMyTw.indexOf(msg) !== -1) {
      if (msg.length >= 140) {
        idx = Math.floor(Math.random() * 140);
        msg = msg.slice(0, idx) + msg.slice(idx + 1, 140);
      } else {
        msg = (msg + '　').slice(0, 140);
      }
    }
    recentlyMyTw.push(msg);
    if (recentlyMyTw.length > 30) {
      recentlyMyTw = recentlyMyTw.slice(-30);
    }
    return msg;
  }

  if (!msg || (msg.trim() === '')) {
    return;
  }

  msg = msg + footer;
  msg = msg.slice(0, 140);
  msg = dub(msg);

  var messaging = {
    status: msg
  };
  if (msg[0] === '@') {
    var name = msg.match(/@([a-zA-Z0-9_]*)/)[1];
    messaging.in_reply_to_status_id = lastID[name];
  }

  if (current_user === "all") {
    (function () {
      var u;
      for (u in users) { post(u, messaging); }
    }());
  } else if (current_user === "random") {
    (function () {
      var len = 0, u;
      for (u in tw) { ++len; }
      var p = Math.random();
      for (u in tw) {
        p -= 1 / len;
        if (p <= 0) {
          post(u, messaging);
          return;
        }
      }
    }());
  } else {
    post(current_user, messaging);
  }
}

function post_by(text, name) {
  var tmp = current_user;
  current_user = name;
  post_to_twitter(text);
  current_user = tmp;
}

function delete_tweet(status_id) {
  if (status_id) {
    var idx = last_status_id.indexOf(status_id);
    if (idx !== -1) {
      last_status_id =
        last_status_id
          .slice(0, idx)
          .concat(last_status_id.slice(idx + 1, last_status_id.length));
    }
  } else {
    status_id = last_status_id.pop();
  }
  console.log('delete', status_id);
  var u, url;
  for (u in users) {
    url = "https://api.twitter.com/1.1/statuses/destroy/" + status_id + ".json";
    tw[u].post(url, {id : status_id}, util.empty);
  }
}

function make_twitter(username, user) {
  if (user.default || !current_user) {
    current_user = username;
  }
  var user_key = {
    consumer_key        : user.consumer_key,
    consumer_secret     : user.consumer_secret,
    access_token_key    : user.access_token_key,
    access_token_secret : user.access_token_secret,
  };
  console.dir(user_key);
  return new Twitter(user_key);
}

function init() {
  var u, username;
  for (u in users) {
    username = u.alias || u;
    tw[username] = make_twitter(username, users[u]);
    if (users.display !== false) { setup(username); }
  }
  console.log('current_user is', current_user);
}

function show(data) {
  var name = data.user.screen_name;
  var nick = data.user.name;
  var text =
          data.text
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, "\"");
  var status_id = data.id_str;
  var source = source_trim(data.source);
  var time = data.created_at;
  var colored;
  var followList = followedBy[name] ? ('(' + followedBy[name] + ')') : '';

  function color_at(str) {
    var color = function (str) { return font.light_green(str); };
    return str.replace(/(@[a-zA-Z0-9_]*)/g, color);
  }

  if (source === 'Ask.fm') { return; }
  if (NG.screen_name(name)) { return; }
  if (NG.text(text)) { return; }
  if (NG.source(source)) { return; }

  colored =
    [font.red('@' + name), font.cyan(nick), font.gray(status_id),
      font.red(followList), font.brown('via ' + source)].join(' ')
    + font.gray(' ++ ' + timezone(time)) + '\n'
    + color_at(text);

  put_str(colored);
  return colored;
}

// data is measured by u
function add_follow_list(data, u) {
  if (!data || !data.user || !data.user.screen_name || !u) {
    return;
  }
  var name = data.user.screen_name;
  if (!followedBy.hasOwnProperty(name)) {
    followedBy[name] = '';
  }
  if (followedBy[name].indexOf(u[0]) === -1) {
    followedBy[name] += u[0];
  }
}

// ---------------------------

function setup(u) {
  console.log("### stream start -- " + u);

  tw[u].stream('user',  function (stream) {
    stream.on('data', function (data) {
      if (!data) {
        return;
      }

      var event = data.event;
      var colored;

      var ed_name, er_name, ing_text;

      if (event === "favorite" || event === "unfavorite") {
        ed_name = data.target_object.user.screen_name;
        er_name = data.source.screen_name;
        ing_text = data.target_object.text;

        colored = font.blue('@' + er_name) + ' ' + font.red(event + 's') + ' ';
        colored += font.blue('@' + ed_name) + ' : ' + ing_text;
        put_str(colored);
        favs.push(colored);

        if (me.is_me(ed_name)) {
          if (me.is_me(er_name) || (ed_name === 'ampeloss' && ing_text.indexOf('ゆゆ式') == -1)) {
            delete_tweet(data.target_object.id_str);
          }
        }

        return;
      }

      if (event === 'follow' || event === "unfollow") {
        ed_name = data.target.screen_name;
        er_name = data.source.screen_name;

        colored = font.blue('@' + er_name) + ' ' + font.red(event + 's') + ' ' + font.blue('@' + ed_name);
        put_str(colored);
        favs.push(colored);
        beep();

        return;
      }
      if (data.event) {
        console.log("###", data.event);
        return;
      }

      if (!data || !data.user || !data.text) {
        return;
      }

      // add follow list
      add_follow_list(data, u);

      // add status_id
      lastID[data.user.screen_name] = data.id_str;

      // nub time line
      var t = hash(data);
      if (recently_tw.indexOf(t) !== -1) {
        return;
      }
      recently_tw.push(t);
      if (recently_tw.length > recently_tw_size) {
        recently_tw = recently_tw.slice(-recently_tw_size);
      }

      // just display
      colored = show(data);

      data.entities.urls.forEach(function (url) {
        put_str('> ' + url.expanded_url);
      });

      var last = data.text[data.text.length - 1];
      if (me.is_me(data.user.screen_name) && (last === '_' || last === '＿')) {
        setTimeout(delete_tweet, delete_lag, data.id_str);
        console.warn("this tweet will be deleted after ", delete_lag);
      }

      if (me.is_me(data.user.screen_name)) { last_status_id.push(data.id_str); }

      if (me.is_reply(data.text)) {
        replies.push(colored);
        beep();
      }

    });

    stream.on('delete', function (data) {
      // console.log(font.esc + "[41;37m" + "deleted" + font.esc + "[m" + " : " + data.status.id_str);
    });

    stream.on('end', function () {
      console.warn("### stream end (after 10sec, retry to connect)");
      setTimeout(setup, 10000, u);
    });

    stream.on('destroy', function () {
      console.warn("### stream destroied");
    });

    stream.on("error", function (e) {
      console.warn("err!", e);
    });
  });
}

function get_reply() {
  var u;
  function handler(u) {
    return function (err, data) {
      if (err) {
        console.warn(err);
        return;
      }
      add_follow_list(data, u);
      data.reverse().forEach(show);
    };
  }
  for (u in users) {
    tw[u].get(URL.mentions_timeline, {count : 6}, handler(u));
  }
}

//----------------- readline
var stdin  = process.stdin;
var stdout = process.stdout;

stdin.resume();
stdin.setEncoding("utf8");
stdin.setRawMode(true);
mode = "stream";

stdin.on("data", function (chunk) {

  function prompt() { stdout.write("> "); }
  function prompt_I() { stdout.write("post> "); }

  function moveToStream() {
    stdin.setRawMode(true);
    mode = "stream";
    console.log(screen_buf);
    screen_buf = "";
    tw_buf = "";
  }

  function proc_stream(chunk) {
    switch (chunk) {
    case 'i':
      mode = "insert";
      stdin.setRawMode(false);
      console.log("post>");
      prompt();
      break;
    case 'I':
      mode = "lineInsert";
      stdin.setRawMode(false);
      prompt_I();
      break;
    case ':':
    case ';':
      mode = "command";
      stdin.setRawMode(false);
      stdout.write(":");
      break;
    case '/':
      mode = "search";
      stdin.setRawMode(false);
      stdout.write('/');
      break;
    default:
      break;
    }
  }

  function proc_insert(chunk) {
    chunk = chunk.trim();

    if (chunk[0] === '.') {
      if (chunk.length > 1) {
        var succ = false;
        var u;
        for (u in users) {
          if (u[0] === chunk[1]) {
            post_by(tw_buf, u);
            succ = true;
            break;
          }
        }
        if (!succ) { post_to_twitter(tw_buf); }
      } else {
        post_to_twitter(tw_buf);
      }
      moveToStream();
    } else if (chunk === 'quit' || chunk === ',') {
      moveToStream();
    } else {
      if (tw_buf === '') {
        tw_buf = chunk;
      } else {
        tw_buf += '\n' + chunk;
      }
      prompt();
    }
  }

  function proc_lineInsert(chunk) {
    chunk = chunk.trim();
    if (chunk === '.' || chunk === ',') {
      moveToStream();
      return;
    }
    post_to_twitter(chunk);
    if (screen_buf !== '') {
      console.log(screen_buf);
      screen_buf = '';
    }
    prompt_I();
  }

  function proc_repl(chunk) {
    if (chunk[0] === ':') {
      proc_command(chunk.slice(1));
    } else {
      try {
        it = eval(chunk);
        console.log(it);
      } catch (e) {
        lasterr = e;
        console.log(e);
      }
      prompt();
    }
  }

  function proc_search(chunk) {
    chunk = chunk.trim();
    var n = 15;
    var word;
    if (chunk === '') {
      word = last_search_word;
    } else {
      var ws = chunk.split(" ");
      if (ws.length >= 2 && !isNaN(ws[0])) {
        n = +ws[0];
        ws = ws.slice(1);
      }
      word = ws.join(" ");
      last_search_word = word;
    }
    tw[current_user].get(
      URL.tweets,
      { q: word, count: n, lang: "ja", result_type: "recent" },
      function (err, data) {
        if (err) { console.warn(err); }
        if (!data || !data.statuses) {
          console.log("fail to search:", last_search_word);
        } else {
          console.log("\n-- result of search");
          data = data.statuses;
          data.reverse().forEach(show);
          console.log();
        }
        moveToStream();

      }
    );
  }

  function proc_command(chunk) {
    var url, id, scname, sname;

    chunk = chunk.trim();
    if (chunk === 'q') { // quit
      process.exit();
    } else if (chunk === 'x') {
      delete_tweet();
    } else if (chunk === 's') {
      moveToStream();
    } else if (chunk === 'sh') { // goto repl
      mode = "repl";
      stdin.setRawMode(false);
      prompt();
    } else if (chunk.indexOf("ls") === 0) {
      var ret = [];
      var u;
      for (u in users) { ret.push(u); }
      console.log(ret.join(" "));
    } else if (chunk.indexOf("cd") === 0) {
      if (chunk.indexOf("cd ") === -1) {
        console.log("### current user is " + current_user);
      } else {
        var next_user = chunk.split(" ")[1];
        if (next_user === "all") {
          current_user = "all";
        } else if (next_user === "random") {
          current_user = "random";
        } else if (tw.hasOwnProperty(next_user)) {
          current_user = next_user;
          console.log("# change account to " + current_user);
        } else {
          var v;
          for (v in users) {
            if (next_user[0] === v[0]) {
              current_user = v;
              console.log("# change account to " + current_user);
            }
          }
        }
      }
    } else if (chunk === 'reply') {
      get_reply();
    } else if (chunk === 'r') {
      console.log("### replies to you");
      if (replies.length === 0) {
        console.log("nothing");
      } else {
        console.log(replies.join("\n"));
      }
      console.log("");

      var repliesMaxSize = 10;
      if (replies.length > repliesMaxSize) {
        replies = replies.slice(-repliesMaxSize);
      }
    } else if (chunk === "f") {
      console.log("### faved of you");
      if (favs.length === 0) {
        console.log("nothing");
      } else {
        console.log(favs.join("\n"));
      }
      console.log("");

      var favsMaxSize = 10;
      if (favs.length > favsMaxSize) {
        favs = favs.slice(-favsMaxSize);
      }
    } else if (chunk === "reload") {
      setTimeout(function () {
        console.log("re-init");
        init();
      }, 2000);
    } else if (chunk[0] === '!') {
      child.exec(chunk.slice(1), function (err, out) {
        if (err) { console.warn(err); }
        console.log(out);
      });
    } else if (chunk.slice(0, 3) === "RT ") {
      id = chunk.split(" ")[1];
      url = "https://api.twitter.com/1.1/statuses/retweet/" + id + ".json";
      tw[current_user].post(url, {}, util.empty);
    } else if (chunk === 'oppai') {
      var ls = [ "350446995057557506", "414080768017571840", "162076119531667457" ];
      var i, len = ls.length;
      for (i = 0; i < len; ++i) {
        url = "https://api.twitter.com/1.1/statuses/retweet/" + ls[i] + ".json";
        tw[current_user].post(url, {}, util.empty);
      }
    } else if (chunk.slice(0, 4) === 'fav ') {
      id = chunk.split(' ')[1];
      console.log(current_user, "favs", id);
      tw[current_user].post(URL.favorites_create, { "id" : id }, util.empty);
    } else if (chunk.slice(0, 7) === 'follow ') {
      scname = chunk.split(' ')[1];
      tw[current_user].post(URL.friendships_create, {"screen_name" : scname }, util.empty);
    } else if (chunk.slice(0, 9) === 'unfollow ') {
      scname = chunk.split(" ")[1];
      tw[current_user].post(URL.friendships_destroy, {"screen_name" : scname }, util.empty);
    } else if (chunk.slice(0, 5) === 'spam ') {
      scname = chunk.split(" ")[1];
      tw[current_user].post(URL.report_spam, {"screen_name" : scname }, util.empty);
    } else if (chunk.slice(0, 5) === 'icon ') {
      sname = chunk.split(' ')[1];
      tw[current_user].get(
        URL.user_timeline,
        {screen_name : sname, count : 1},
        function (err, data) {
          if (err) { console.warn(err); }
          url = data[0].user.profile_image_url;
          url = url.replace(/_normal/, '');
          child.exec('feh ' + url, util.empty);
        }
      );
    } else if (chunk.slice(0, 7) === 'browse ') {
      sname = chunk.split(' ')[1];
      tw[current_user].get(
        URL.user_timeline,
        {screen_name : sname, count : 20},
        function (er, data) {
          if (er || !data) {
            console.warn("err:", er);
            return;
          }
          put_str('/* user timeline of ' + sname + ' */');
          data.reverse().forEach(show);
          put_str('');
        }
      );
    } else if (chunk === 'browse') {
      tw[current_user].get(
        URL.home_timeline,
        {},
        function (er, data) {
          if (er) { console.warn(er); }
          put_str('/* home timeline of ' + current_user + ' */');
          data.reverse().forEach(show);
        }
      );
    }

    if (mode === "command") {
      moveToStream();
      return;
    }
    prompt();
  }

  return mode === "repl"    ? proc_repl(chunk)
       : mode === "stream"  ? proc_stream(chunk)
       : mode === "command" ? proc_command(chunk)
        : mode === "insert"  ? proc_insert(chunk)
          : mode === "search"  ? proc_search(chunk)
            :                     proc_lineInsert(chunk);

});

// --------------  main

init();
get_reply();

