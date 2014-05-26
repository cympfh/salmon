Vim interface, Twitter client

Get Starting
============

1. install node
1. `npm install -g ntwitter`
1. autherize and create your `setting.json`

```
node salmon.js
```

or

```
rlwrap -f ~/.salmon_completions salmon.js
```

setting.json
------------

```json
{
  "users": {
    "account1" : {
        "consumer_key":    "---------------------"
      , "consumer_secret": "-----------------------------------------"
      , "access_token_key":    "--------------------------------------------------"
      , "access_token_secret": "---------------------------------------------"
      , "display": "true"
    }
    ,
    "account2": {
        "consumer_key":    "----------------------"
      , "consumer_secret": "------------------------------------------"
      , "access_token_key":    "--------------------------------------------------"
      , "access_token_secret": "---------------------------------------------"
      , "display": "true"
      , "default": "true"
    }
    ,
    "accout3": {
```

each account requires `consumer_key`, `consumer_secret`, `access_token_key` and `access_token_secret`.

optional key `display` and `default`.

- display -- true | false | talse
- default -- true

tools
-----

For easy completion of Twitter IDs,
run `tools/getFollows.js`

```
node ./tools/getFollows.js > ~/.salmon_completions
```

to tweet
========

- i -- insert

```
[i]
> hoge
> fuga
> .
```

tweet "hoge\nfuga"

- I -- insert (one line)

```
[I]
> hoge
> fuga
> .
```

tweet "hoge",
and
tweet "fuga"

COMMANDS
========

- :q
- :x
- :s
- :sh
- :ls
- :cd `your ID`
- :reply
- :f
- :r
- :reload
- :! `sh command`
- :RT `status_id`
- :fav `status_id`
- :follow `ID`
- :unfollow `ID`
- :spam `ID`
- :icon `ID`
- :browse `ID`

