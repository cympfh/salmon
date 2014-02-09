Vim interface, Twitter client
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

