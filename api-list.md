# Chess.com Published Data API

Reference for the public, read-only Chess.com Published Data API (PubAPI).

- Documentation source: [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api)
- API base URL: `https://api.chess.com/pub`
- Authentication: none
- HTTP method: `GET`
- Default response: JSON-LD-compatible JSON

## Quick Start

```bash
curl https://api.chess.com/pub/player/hikaru
```

Replace path placeholders such as `{username}`, `{url-id}`, `{id}`, `{iso}`,
`{yyyy}`, and `{mm}` with URL-safe values.

## Endpoint List

### Player endpoints

| Endpoint | Description |
| --- | --- |
| `GET /player/{username}` | Player profile |
| `GET /titled/{title}` | Usernames for players with a title |
| `GET /player/{username}/stats` | Ratings and game, tactics, lessons, and Puzzle Rush statistics |
| `GET /player/{username}/is-online` | Whether the player was online in the last five minutes |
| `GET /player/{username}/games` | Current Daily Chess games |
| `GET /player/{username}/games/to-move` | Daily Chess games where the player must act |
| `GET /player/{username}/games/archives` | Available monthly game archive URLs |
| `GET /player/{username}/games/{yyyy}/{mm}` | Finished games for a month |
| `GET /player/{username}/games/live/{base-time}/{increment}` | Finished Live Chess games for a time control |
| `GET /player/{username}/games/{yyyy}/{mm}/pgn` | Multi-game PGN download for a month |
| `GET /player/{username}/clubs` | Clubs the player belongs to |
| `GET /player/{username}/matches` | Team matches involving the player |
| `GET /player/{username}/tournaments` | Tournaments involving the player |

### Club endpoints

`{url-id}` is the club identifier from its Chess.com web URL.

| Endpoint | Description |
| --- | --- |
| `GET /club/{url-id}` | Club profile |
| `GET /club/{url-id}/members` | Members grouped by recent activity |
| `GET /club/{url-id}/matches` | Club team matches grouped by status |

### Tournament endpoints

`{url-id}` is the tournament identifier from its Chess.com web URL.

| Endpoint | Description |
| --- | --- |
| `GET /tournament/{url-id}` | Tournament details |
| `GET /tournament/{url-id}/{round}` | Tournament round details |
| `GET /tournament/{url-id}/{round}/{group}` | Tournament round-group details |

### Team match endpoints

For Daily Team Matches, `{id}` is the match ID from the web URL. Live team
matches use the `/match/live/` path.

| Endpoint | Description |
| --- | --- |
| `GET /match/{id}` | Daily Team Match details |
| `GET /match/{id}/{board}` | Daily Team Match board details |
| `GET /match/live/{id}` | Live Team Match details |
| `GET /match/live/{id}/{board}` | Live Team Match board details |

### Country endpoints

`{iso}` is an uppercase two-character ISO 3166-1 code. Chess.com also uses
some user-assigned codes for regions, including `XA`, `XB`, `XC`, `XE`, `XG`,
`XK`, `XP`, `XS`, `XW`, and `XX`.

| Endpoint | Description |
| --- | --- |
| `GET /country/{iso}` | Country profile |
| `GET /country/{iso}/players` | Recently active players associated with a country |
| `GET /country/{iso}/clubs` | Clubs associated with a country |

### Other endpoints

| Endpoint | Description |
| --- | --- |
| `GET /puzzle` | Current daily puzzle |
| `GET /puzzle/random` | Randomly selected daily puzzle |
| `GET /streamers` | Current Chess.com streamer list |
| `GET /leaderboards` | Top 50 players for supported leaderboards |

## Endpoint Details

### Player profile

`GET /player/{username}`

Returns public profile data such as:

- `username`, `player_id`, `title`, and `status`
- optional `name`, `avatar`, `location`, `twitch_url`, and `fide`
- `country`, `joined`, `last_online`, `followers`, and `is_streamer`

`player_id` does not change when a username changes, although future
availability of the ID is not guaranteed.

### Titled players

`GET /titled/{title}`

Returns `{ "players": [...] }`, an array of usernames. Supported title codes:
`GM`, `WGM`, `IM`, `WIM`, `FM`, `WFM`, `NM`, `WNM`, `CM`, and `WCM`.

### Player stats

`GET /player/{username}/stats`

The response contains optional objects for game types such as
`chess_daily`, `chess960_daily`, `chess_blitz`, and other rules/time-class
combinations. It may also contain `tactics`, `lessons`, and `puzzle_rush`.

Game-type stats can include `last`, `best`, `record`, and `tournament` data.
Only collected, non-default values are returned, so missing objects and fields
are normal.

### Player online status

`GET /player/{username}/is-online`

Returns:

```json
{
  "online": true
}
```

The value indicates activity within the previous five minutes.

### Player games

The current, to-move, and monthly archive endpoints use a wrapper like:

```json
{
  "games": []
}
```

Common game fields include:

- `pgn`, `fen`, `url`, `time_control`, `time_class`, and `rules`
- `white` and `black` player information
- `start_time`, `end_time`, and `last_activity` timestamps when applicable
- `tournament`, `match`, and `eco` URLs when available

Known `rules` values include `chess`, `chess960`, `bughouse`,
`kingofthehill`, `threecheck`, and `crazyhouse`. Known `time_class` values
include `daily`, `rapid`, `blitz`, and `bullet`.

#### Current Daily Chess

`GET /player/{username}/games`

Returns games the player is currently playing. Current-game data can include
`turn`, `move_by`, and an optional `draw_offer`.

#### To-move Daily Chess

`GET /player/{username}/games/to-move`

Returns games requiring action. A game with a draw offer may appear even when
it is not the player's turn; in that case `move_by` is `0`.

#### Available archives

`GET /player/{username}/games/archives`

Returns `{ "archives": [...] }`, an ascending list of monthly archive URLs.

#### Complete monthly archive

`GET /player/{username}/games/{yyyy}/{mm}`

`{yyyy}` is the four-digit game-end year and `{mm}` is the two-digit month.
The archive contains finished Live and Daily Chess games.

#### Live archive by time control

`GET /player/{username}/games/live/{base-time}/{increment}`

`{base-time}` and `{increment}` are seconds. For example, `180/2` represents
three minutes plus a two-second increment.

#### Multi-game PGN download

`GET /player/{username}/games/{yyyy}/{mm}/pgn`

Returns raw PGN rather than JSON. Important response headers are:

- `Content-Type: application/x-chess-pgn`
- `Content-Disposition: attachment; filename="ChessCom_username_YYYYMM.pgn"`

### Player participation

#### Clubs

`GET /player/{username}/clubs`

Returns `{ "clubs": [...] }`. Club entries can include the club API URL,
web URL, name, icon, joined timestamp, and last-activity timestamp.

#### Team matches

`GET /player/{username}/matches`

Returns `finished`, `in_progress`, and `registered` arrays. Entries can include
the match name, website URL, API URL, club URL, board URL, and the player's
results.

#### Tournaments

`GET /player/{username}/tournaments`

Returns `finished`, `in_progress`, and `registered` arrays. Finished entries
can include wins, losses, draws, points, placement, status, and player count.

### Clubs

#### Club profile

`GET /club/{url-id}`

Returns the club name, `club_id`, icon, country, average daily rating,
member count, creation and activity timestamps, visibility, join-request URL,
administrator profile URLs, and description.

#### Club members

`GET /club/{url-id}/members`

Returns `weekly`, `monthly`, and `all_time` arrays. Each member entry contains
`username` and `joined`. Activity lists may lag by up to 24 hours and this
endpoint is refreshed at most every 12 hours.

#### Club matches

`GET /club/{url-id}/matches`

Returns `registered`, `in_progress`, and `finished` match arrays. Finished
entries include the match name, API URL, opponent club URL, result, start time,
and time class.

### Tournaments

#### Tournament

`GET /tournament/{url-id}`

Returns tournament metadata including status, creator, finish time, settings,
players, and round URLs. Settings may include rules, time class, time control,
rating mode, player limits, advancement rules, and round configuration.

#### Tournament round

`GET /tournament/{url-id}/{round}`

Returns group URLs and round players. Completed rounds can include each
player's `is_advancing` value.

#### Tournament round group

`GET /tournament/{url-id}/{round}/{group}`

Returns fair-play removals, games, and players. Player entries can include
`points`, `tie_break`, and `is_advancing`; game entries use the common game
fields described above.

### Team matches

#### Daily Team Match

`GET /match/{id}`

Returns match settings, status, board count, and `team1`/`team2` data. The
registration response includes team and player details; in-progress and
finished responses can include board URLs, stats URLs, game results, and
fair-play removals.

#### Daily Team Match board

`GET /match/{id}/{board}`

Returns `board_scores` and the in-progress or finished games on that board.

#### Live Team Match

`GET /match/live/{id}`

Returns scheduled, in-progress, or finished Live Team Match data. Live settings
include numeric `time_control` and `time_increment` values. Finished matches
include team results, player board URLs, and game results.

#### Live Team Match board

`GET /match/live/{id}/{board}`

Returns board scores and the games on a live team-match board. Only in-progress
or finished games are included.

### Countries

#### Country profile

`GET /country/{iso}`

Returns `{ "@id": "...", "name": "...", "code": "..." }`.

#### Country players

`GET /country/{iso}/players`

Returns `{ "players": [...] }` for recently active players, new registrants,
and players who currently identify with the country. A complete all-player
download is not available.

#### Country clubs

`GET /country/{iso}/clubs`

Returns `{ "clubs": [...] }`, an array of club profile URLs associated with
the country.

### Puzzles, streamers, and leaderboards

#### Daily puzzle

`GET /puzzle`

Returns the current puzzle's `title`, `url`, `publish_time`, `fen`, `pgn`, and
`image`. Applications publishing the puzzle should include a visible link to
the Chess.com puzzle page.

#### Random daily puzzle

`GET /puzzle/random`

Uses the same response shape as `/puzzle`. The result is cached briefly, so
successive requests do not necessarily return a different puzzle immediately.

#### Streamers

`GET /streamers`

Returns `{ "streamers": [...] }`. Each entry can include `username`, `avatar`,
`twitch_url`, and the player's profile URL. The endpoint refreshes every five
minutes.

#### Leaderboards

`GET /leaderboards`

Returns arrays for the supported leaderboards. Each player entry includes
`player_id`, profile URLs, `username`, `score`, and `rank` from 1 through 50.

The documented leaderboard keys are:

- `daily`, `daily960`
- `live_rapid`, `live_blitz`, `live_bullet`, `live_bughouse`
- `live_blitz960`, `live_threecheck`, `live_crazyhouse`, `live_kingofthehill`
- `lessons`, `tactics`

The endpoint refreshes when one of its leaderboards is updated.

## Shared API Behavior

### Response codes

| Code | Meaning |
| --- | --- |
| `200` | JSON or PGN response returned successfully |
| `301` | Requested URL is known to have moved; use the new URL |
| `304` | Cached representation has not changed |
| `404` | Malformed URL or unavailable data, such as an unknown username |
| `410` | Data will never be available at the requested URL |
| `429` | Request refused because of rate limiting |

### Rate limits and freshness

- Serial access is unlimited when each request waits for the previous response.
- Parallel requests can receive `429 Too Many Requests`.
- Abnormally high or suspicious activity can result in an application block.
- Use a recognizable `User-Agent` with contact information for applications
  making regular requests.
- Most endpoints are refreshed no more than once every 24 hours unless their
  endpoint notes specify a different interval.
- Data may be stale, particularly when a user is still using the legacy v2
  website. Responses and descriptive text are in English.

### Caching

Responses provide `ETag` and `Last-Modified` headers. Send the corresponding
`If-None-Match` and `If-Modified-Since` headers to validate a cached response.
The server can return `304 Not Modified`. `Cache-Control: max-age` indicates
how frequently a client should revalidate.

### JSON-LD and JSONP

JSON-LD responses can be consumed as ordinary JSON. Responses also provide a
`Link` header identifying the JSON-LD context. A `callback` query parameter can
wrap JSON in JSONP for script-tag clients; callback names containing non-literal
characters or longer than 200 characters are removed.

### Compression and HTTP/2

Clients may send `Accept-Encoding: gzip` to reduce transfer size. HTTP/2 is
supported, but it does not remove the parallel-request rate limits.

### Timestamps

Time fields are Unix timestamps: seconds since `1970-01-01 00:00:00 UTC`.

## Game Result Codes

Game-related endpoints can return these result values:

| Code | Meaning |
| --- | --- |
| `win` | Win |
| `checkmated` | Checkmated |
| `agreed` | Draw agreed |
| `repetition` | Draw by repetition |
| `timeout` | Timeout |
| `resigned` | Resigned |
| `stalemate` | Stalemate |
| `lose` | Lose |
| `insufficient` | Insufficient material |
| `50move` | Draw by the 50-move rule |
| `abandoned` | Abandoned |
| `kingofthehill` | Opponent king reached the hill |
| `threecheck` | Checked for the third time |
| `timevsinsufficient` | Timeout versus insufficient material |
| `bughousepartnerlose` | Bughouse partner lost |

## Scope

The PubAPI exposes public data only. It does not provide authentication or
write operations, and cannot submit moves, access private game chat, or access
other data restricted to logged-in users.