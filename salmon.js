var child   = require("child_process")
  , fs      = require("fs")
  , twitter = require("ntwitter")
  , setting = require("../setting.json")
  , users   = setting.users
  , print   = console.log

  , args = process.argv
  , cd = (function(l){ return l.slice(0, l.lastIndexOf("/")) })(process.argv[1])
  , OS = ('TERM_PROGRAM' in process.env) ? 'MAC' : 'LINUX'
  , open_command = (OS === 'MAC') ?  'open' : 'firefox'
  ;

var beep = require("./beep")(OS);

var
// const
    zeroSpace = String.fromCharCode(8203)
  , esc = String.fromCharCode(27)
  , recently_tw_size = 6
  , delete_lag = 10 * 60000

// stack
  , replies = []
  , favs = []
  , recently_tw = []
  , recentlyMyTw = []
  , followedBy = []
  , lastID = []

  , tw_buf = ""
  , screen_buf = ""
  , footer = ""

  , mode = "stream" // repl | stream | insert | lineInsert | command

  , last_status_id = []
  , last_search_word = ''

  , tw = {}
  , current_user

  , it
  , lasterr
  ;

// ----------------- twitter

function init() {
  for (var u in users) {
    tw[u] = make_twitter(u);
    setup(u);
  }
  console.log("current_user =", current_user);
}

function make_twitter(name) {
  var u = users[name];
  if (u.default) current_user = name;
  else if (!current_user) current_user = name;
  return new twitter({
    consumer_key        : u.consumer_key,
    consumer_secret     : u.consumer_secret,
    access_token_key    : u.access_token_key,
    access_token_secret : u.access_token_secret,
  });
}

// --------------  util

function strTime() {
  var t = new Date();
  return t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds()
}

function trim (str) {
  for (var i=str.length-1; i>=0; --i)
    if (str[i] != ' ' && str[i] != '\n') break;
  return str.slice(0, i+1);
}

function source_trim(str) {
  if (str.indexOf("<a") == 0) str = str.slice(str.indexOf(">")+1, str.length-4);
  return str;
}

String.prototype.count = function(sub) {
  for (var c=i=0;i>=0;i=this.indexOf(sub,i+1),++c);
  return c;
};

function show(data) {
    var name = data.user.screen_name
      , nick = data.user.name
      , text =
            data.text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
      , status_id = data.id_str
      , source = source_trim(data.source)
      , time = data.created_at

    if (source === 'Ask.fm') return;

    colored =
      esc+"[35m@" + name + esc+"[m " +
      esc+"[36m" + nick + esc+"[m "+
      esc+"[33mvia "+source + esc+"[m "+
      time +
      "\n" +
      text
      ;

    putStr(colored);
}

// ---------------------------

function setup(u) {
    console.log("### stream start -- " + u);

    var display =
       (!('display' in users[u])) ? "true"
                       : users[u].display;

    if (display == 'false') return;

    tw[u].stream('user',  function(stream) {
        stream.on('data', function(data) {
            if (!data) return

            var event = data.event;

            if (event == "favorite" || event == "unfavorite") {
                faved_name = data.target_object.user.screen_name;
                faved_text = data.target_object.text;
                faver_name = data.source.screen_name;

                if (faver_name === 'ampeloss') return;

                colored = esc + "[34m@" + faver_name + esc + "[m " + 
                          esc + "[31m" + event + "s" + esc + "[m " +
                          esc + "[34m@" + faved_name + esc + "[m" + 
                          " : " + faved_text;
                putStr(colored);
                favs.push(colored);
                beep();

                return;
            }

            if (event == 'follow' || event == "unfollow") {
                ed_name = data.target.screen_name;
                er_name = data.source.screen_name;

                esc = String.fromCharCode(27)
                colored = esc + "[34m@" + er_name + esc + "[m " + 
                          esc + "[31m" + event + "s" + esc + "[m " +
                          esc + "[34m@" + ed_name + esc + "[m";
                putStr(colored);
                favs.push(colored);
                beep();

                return
            }
            if (data.event) {
                console.log("###", data.event);
                return;
            }

            if (!data || !data.user || !data.text) {
                return
            }

            var user = data.user;
            var name = user.screen_name,
                nick = user.name;
            var text =
                    data.text
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&amp;/g, "&");
            var status_id = data.id_str
            var source = source_trim(data.source)
            var time = strTime();

            if (display == 'talse' && text[0] != '@') {
              return; // mute
            }

            lastID[name] = status_id;

            if (!followedBy[name]) followedBy[name] = [];
            if (!followedBy[name][u]) followedBy[name][u] = true;

            var t = name + text;
            if (recently_tw.indexOf(t) != -1) return; // do nub
            recently_tw.push(t);
            if (recently_tw.length > recently_tw_size)
                recently_tw = recently_tw.slice(-recently_tw_size);

            // just display
            var followingList = "";
            for (var t in followedBy[name]) followingList += t[0];

            if (text.count('\n') >= 12) return;

            colored =
              esc+"[35m@" + name + esc+"[m " +
              esc+"[36m" + nick + esc+"[m "+
              esc+"[37m" + status_id  + esc+"[m "+
              "("+followingList+") " +
              esc+"[33mvia "+source + esc+"[m "+
              time +
              "\n" +
              text;

            putStr(colored);

            var urls = data.entities.urls;
            for (var i in urls) putStr('!'+open_command+' '+urls[i].expanded_url);

            function isMe(name) {
                return (name in users);
            }

            if (isMe(name) && text.slice(0,2) === 'NB')
                setTimeout(deleteTweet, delete_lag, status_id);

            if (isMe(name)) {
                last_status_id.push(status_id);
            }

            function isReply(text) {
                return (/ide1o|cympf|枚方|まいかた|ひらか|ひらら|ampeloss|いらいざ|イライザ|いういざ/.test(text));
            }

            if (isReply(text)) {
                replies.push(colored);
                beep();
            }
        });

        stream.on('delete', function(data) {
          /*
          console.log(
            esc+"[41;37m" + "deleted" + esc+"[m" + " : " +
            data.status.id_str
          );
          */
        });

        stream.on('end', function (response) {
            print("### stream end (after 10sec, retry to connect)")
            setTimeout(setup, 10000, u);
        });

        stream.on('destroy', function (response) {
            print("### stream destroied")
            // setTimeout(setup, 2000, u);
        });

        stream.on("error", function (e) {
            print("err!", e);
        });
    });
}

//----------------- readline
var stdin  = process.stdin,
    stdout = process.stdout;

stdin.resume();
stdin.setEncoding("utf8");
stdin.setRawMode(true);
mode = "stream";

stdin.on("data", function(chunk) {
    return mode == "repl"   ? proc_repl(chunk)
         : mode == "stream" ? proc_stream(chunk)
         : mode == "command"? proc_command(chunk)
         : mode == "insert" ? proc_insert(chunk)
         : mode == "search" ? proc_search(chunk)
         : proc_lineInsert(chunk);

    function prompt() {
        stdout.write("> ");
    }
    function prompt_I() {
        stdout.write("post> ");
    }

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
                mode = "search"
                stdin.setRawMode(false);
                stdout.write("/");
                break;
            default:
                break;
        }
    }

    function proc_insert(chunk) {
        chunk = trim(chunk);

        if (chunk[0] == '.') {
            if (chunk.length > 1) {
                var succ = false;
                for (u in users) {
                    if (u[0] == chunk[1]) {
                        PostBy(tw_buf, u);
                        succ = true;
                        break;
                    }
                }
                if (!succ)
                    PosttoTwitter(tw_buf);
            }
            else
                PosttoTwitter(tw_buf);
            moveToStream();
        } else if (chunk == "quit" || chunk == ",") {
            moveToStream();
        } else {
            if (tw_buf == "")
                tw_buf = chunk;
            else
                tw_buf += '\n'+chunk;
            prompt();
        }
    }

    function proc_lineInsert(chunk) {
        chunk = chunk.trim();
        if (chunk == "." || chunk==',') {
            moveToStream();
            return;
        }
        else {
            PosttoTwitter(chunk);
        }
        if (screen_buf != "") {
            console.log(screen_buf);
            screen_buf = "";
        }
        prompt_I();
    }

    function proc_repl(chunk) {
        if (chunk[0] == ":")
            proc_command(chunk.slice(1));
        else {
            try {
                console.log(it = eval(chunk));
            } catch (e) {
                lasterr = e;
                console.log(e);
            }
            prompt();
        }
    }

    function proc_search(chunk) {
      chunk = chunk.trim();

      var n = 15
        , word

      if (chunk === "") {
        word = last_search_word;
      }
      else {
        var ws = chunk.split(" ");
        if (ws.length >= 2 && !isNaN(ws[0])) {
          n = +ws[0];
          ws = ws.slice(1);
        }
        word = ws.join(" ");
        last_search_word = word;
      }
      tw[current_user].get("https://api.twitter.com/1.1/search/tweets.json"
                          , { q: word, count: n, lang: "ja"
                            , result_type: "recent" }
                          , function (err, data) {

          if (!data || !("statuses" in data)) {
            console.log("fail to search:", last_search_word);
          }
          else {
            console.log("-- result of search ---------------------------")
            data = data.statuses;
            for (var i=data.length-1; i>=0; --i) {
              var d = data[i];
              if (!d) continue;
              var name = d.user.screen_name
                , text = d.text;
              var colored = esc+"[34m@" + name + esc+"[m : "+ text;
              console.log(colored);
            }
            console.log("");
          }
          moveToStream();

                            });
    }

    function proc_command(chunk) {
        chunk = chunk.trim();
        if (chunk == 'q') { // quit
            process.exit();
        }
        else if (chunk == 'x') {
            deleteTweet();
        }
        else if (chunk == 's') {
            moveToStream();
            return;
        }
        else if (chunk == "sh") {
          // goto repl
          mode = "repl";
          stdin.setRawMode(false);
          prompt();
          return;
        }
        else if (chunk.indexOf("ls") == 0) {
            var ret = [];
            for (var u in users) ret.push(u);
            console.log(ret.join(" "));
        }
        else if (chunk.indexOf("cd") == 0) {
            if (chunk.indexOf("cd ") == -1) {
                console.log("### current user is " + current_user);
            }
            else {
                next_user = chunk.split(" ")[1];
                if (next_user == "all")
                    current_user = "all";
                else if (next_user == "random")
                    current_user = "random";
                else if (next_user in tw) {
                    current_user = next_user;
                    console.log("# change account to " + current_user);
                } else {
                    for (var u in users)
                        if (next_user[0] == u[0]) {
                            current_user = u;
                            console.log("# change account to " + current_user);
                        }
                }
            }
        }
        if (chunk === "reply") {
          getReply();
        }
        if (chunk == "r") {
            console.log("### replies to you")
            if (replies.length == 0)
                console.log ("nothing")
            else
                console.log(replies.join("\n"))
            console.log("");

            var repliesMaxSize = 10;
            if (replies.length > repliesMaxSize)
                replies = replies.slice(-repliesMaxSize);
        }
        else if (chunk == "f") {
            console.log("### faved of you")
            if (favs.length == 0)
                console.log ("nothing")
            else
                console.log(favs.join("\n"))
            console.log("");

            var favsMaxSize = 10;
            if (favs.length > favsMaxSize)
                favs = favs.slice(-favsMaxSize);
        }
        else if (chunk == "reload") {
            setTimeout(function(){
              console.log("re-init");
              init();
            }, 2000);
        }
        else if (chunk[0] == '!') {
          child.exec(chunk.slice(1), function(_1, _2, _3) {
            console.log(_2)
          })
        }
        else if (chunk.slice(0,3) === "RT ") {
          var id = chunk.split(" ")[1];
          tw[current_user].post(
              "https://api.twitter.com/1.1/statuses/retweet/"+id+".json"
            , {}
            , function(){});
        }
        else if (chunk == 'oppai') {
          var ls = [
            "350446995057557506"
          , "414080768017571840"
          , "162076119531667457" ];

          for (var i=0; i<ls.length; ++i) {
            tw[current_user].post(
                "https://api.twitter.com/1.1/statuses/retweet/"+ls[i]+".json"
              , {}
              , function(){}); }
        }
        else if (chunk.slice(0,4) == 'fav ') {
          var id = lastID[chunk.split(' ')[1]];
          console.log(current_user, "favs", id);
          var url = "https://api.twitter.com/1.1/favorites/create.json";
          tw[current_user].post(url, { "id" : id }, function(er, data) {});
        }
        else if (chunk.slice(0, 7) === 'follow ') {
          var url = "https://api.twitter.com/1.1/friendships/create.json";
          var scname = chunk.split(" ")[1];
          tw[current_user].post(url, {"screen_name" : scname }, function(){});
        }
        else if (chunk.slice(0, 7) == 'browse ') {
          var sname = chunk.split(' ')[1];
          var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
          tw[current_user].get(url
                 , {screen_name : sname, count : 20}
                 , function(er, data) {
                     if (er || !data) {
                       console.dir("err:",er);
                       return
                     }
                     putStr('/* user timeline of ' + id + ' */');
                     for (var i=data.length-1; i>=0; --i)
                       show(data[i]);
                   });
        }
        else if (chunk == 'browse') {

          var url = "https://api.twitter.com/1.1/statuses/home_timeline.json";
          tw[current_user].get(url
                 , { "id" : id }
                 , function(er, data) {
                     putStr('/* home timeline of', current_user, ' */');
                     for (var i=data.length-1; i>=0; --i)
                       show(data[i]);
                   });
        } else if (chunk.slice(0, 5) === "image") {
          var fname = chunk.split(' ')[1];
          upload(fname);
        }

        if (mode == "command") {
            moveToStream();
            return;
        }
        prompt();
    }
});

var post = PosttoTwitter;
function PosttoTwitter (msg) {
    if (msg == undefined || msg == "" || msg == "\n") return;

    msg = msg + footer;
    msg = msg.slice(0, 140);
    msg = dub(msg);

    var msgObject;
    if (msg[0] == "@") {
      var name_ = msg.match(/@([a-zA-Z0-9_]*)/)[1];
      msgObject = {status : msg , in_reply_to_status_id : lastID[name_] };
    } else {
      msgObject = { status: msg };
    }

    if (current_user == "all") {
        for (var u in users) post(u);
    } else if (current_user == "random") {
      (function () {
        var len = 0
        for (var u in tw) ++len
        for (var u in tw)
          if (Math.random() <= 1/len) { post(u); break }
          else --len
      })();
    } else {
      post(current_user);
    }

    return;

    // where
    function post(u) {
      if (!(u in tw)) {
        console.log("err : " + u + " not in tw");
        return;
      }
      tw[u].post("https://api.twitter.com/1.1/statuses/update.json"
                , msgObject, function(er){ if(er) console.log(er) });
    }

    function dub(msg) {
      while (recentlyMyTw.indexOf(msg) !== -1) {
        if (msg.length >= 140) {
          var idx = Math.floor(Math.random()*140);
          msg = msg.slice(0, idx) + msg.slice(idx + 1, 140);
        } else {
          msg = (msg + zeroSpace).slice(0, 140);
        }
      }
      recentlyMyTw.push(msg);
      if (recentlyMyTw.length > 30)
        recentlyMyTw = recentlyMyTw.slice(-30);
      return msg;
    }
}

function PostBy(text, name) {
  var tmp = current_user;
  current_user = name;
  PosttoTwitter(text);
  current_user = tmp;
}

function deleteTweet(status_id) {
  if (status_id) {
    var idx = last_status_id.indexOf(status_id);
    if (idx !== -1) {
      last_status_id =
        last_status_id.slice(0, idx)
          .concat( last_status_id.slice(idx+1, last_status_id.length) )
    }
  } else {
    status_id = last_status_id.pop();
  }
  console.log("delete", status_id);
  for (var u in users)
    tw[u].post("https://api.twitter.com/1.1/statuses/destroy/"+status_id+".json",
               {id : status_id}, function(){});
}

function getReply () {
  for (u in users)
  tw[u].get("https://api.twitter.com/1.1/statuses/mentions_timeline.json",
    {count : 6},
  function(err, dat){
    if (err) return print(err);
    for (var i=dat.length-1; i>=0; --i) {
      var d = dat[i];
      console.log(
        esc+"[34m@"+d.user.screen_name+" / "+d.user.name + esc+"[m" +
        " ; " + esc+"[33mvia " + source_trim(d.source) + esc+"[m" +
        " ; " + d.created_at + "\n" + d.text);
    }
  });
}

function upload(filename) {
  filename = filename.replace('~', process.env.HOME);
  child.exec('base64 -w 0 '+filename+' >/tmp/imagebased', function () {
    fs.readFile('/tmp/imagebased', 'utf8', function(er, b) {
      console.log("upload",filename,b.slice(0, 50))
      var url =
        "https://api.twitter.com/1.1/statuses/update_with_media.json";
      tw[current_user].post(url, { status:"", filename:"media.png", "media[]":b }
                          , function(er,data){console.log(er,data)});
    });
  });
}

// stdout
function putStr (text) {
    if (mode == "stream")
        console.log(text);
    else
        screen_buf += text + "\n";
}

function iota(n) {
  for (var i=0, r=[]; i<n; ++i) r[i] = i;
  return r;
}

// --------------  main

init();
getReply();

