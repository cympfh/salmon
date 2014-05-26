Vim interface, Twitter client

Get Starting
============

```
node salmon.js
```

or

```
rlwrap -f ~/.salmon_completions salmon.js
```

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

