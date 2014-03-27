Vim interface, Twitter client

Use
===

modes
---

- stream (normal)
- command
- insert
- insertLine
- repl

stream (normal)
---

tweet streams

### type...

- [:]
    goto command
- [i]
    goto insert
- [I]
    goto insertLine

command
---

type command following [:]

    note: when not stream mode, twitter stream is blocked

### type...

| command | description |
|:--------|:------------|
| :sh     | goto repl   |
| :q      | exit salmon |
| :r      | look replies gotten while stream |
| :f      | look fav, followed, unfollowed gotten while stream |
| :reply  | look replies (this is not stream API) |

insert
---

post to Twitter
lines joined with '\n'.

to finish typing and post,
input just '.' line.

example.

    post> line1
    line2
    .

this example posted as "line1\nline2".

to cancel posting, input just ',' alt of '.'.

    post> line1
    line2
    ,

this example is not posted.

after post or cancel, goto stream mode.

insertLine
---

this is another insert mode.
every line are posted as 1-line.
to finish insertLine (that is to goto stream), type just '.'

repl
---

this is JavaScript repl to debug or hack.

Start
===

    node salmon.js

i recommend

    rlwrap -f ~/.salmon_completions salmon.js

or

    alias salmon='rlwrap -f ~/.salmon_completions salmon.js'

here, .salmon_completions is a list file of words, e.g. Twitter ID list of you follows.

To get Twitter ID list, I wrote script/getFollows.js (1.1/get/friend/list). But this API's limit is too narrow.

    node ./script/getFollows.js > ~/.salmon_completions

