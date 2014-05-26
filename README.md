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
        "consumer_key":    "6eURWj9HZNHLOHVjHlemA"
      , "consumer_secret": "ePJ0KSEHskh1kzYzuAB6f8LCGegOknyfn8TghCIRY"
      , "access_token_key":    "342000322-ibbFBSKBDX8SHW8GrHngqOOcNV5pVlmQxK5jdZeo"
      , "access_token_secret": "nOJrEnbe4Z7cI3jA8COHy9LERgYjfjpzepJ9sPw70bvdi"
      , "display": "true"
    }
    ,
    "account2": {
        "consumer_key":    "qnNRwjeo8zFjhIDfgG1F6Q"
      , "consumer_secret": "JtKRv1e9QIEG6mKvWl0g4ygGVGzWclgfd7GaSBEGtg"
      , "access_token_key":    "2209919010-HdNJADFiBIhwyTeg5sgZbZZoBxO2yDb02hICjVc"
      , "access_token_secret": "laAhSf2igiOVNflmjjV8oNxdUl0Lbc6kDSJrx1Yr6M0d2"
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

