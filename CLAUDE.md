@AGENTS.md

# Project: Game Night

A shared log of board game nights for a friend group. Anyone with the
link can record a session: which game, what date, who played, who won.
The app shows past sessions and a standings table of wins per player.

No accounts in v1. Anyone with the link can read and write.

## Stack

- Next.js (App Router), TypeScript
- Tailwind CSS
- Supabase (Postgres) for data
- Deployed on Vercel

## Data model

Four tables. Every fact is stored exactly once; nothing stores a
name where it could store an id.

- `players` — id, name
- `games` — id, name
- `sessions` — id, played_on (date), game_id → games.id
- `results` — id, session_id → sessions.id, player_id → players.id, won (boolean)

Notes:

- A session has many results, one per player who played.
- `won` is a boolean per player, so ties (multiple winners) are valid.
- Never store a game name or player name in `results` or `sessions`.
  Store the foreign key and join.

## Scope for v1

In: add a session, list past sessions, standings (wins per player).
Adding a session allows creating a new player or game inline.

Explicitly out of v1: accounts, scores beyond win/lose, teams, photos,
editing past sessions, per-game statistics.

## The Archive — structure and design

The app is a book. Not a website styled like one: a bound volume in
which the history of game nights is recorded. Every screen is a
spread of it. When a design decision is unclear, the question is
"what would this be, in a book?"

### The physical object

- An open two-page spread, always. Left page and right page do
  different jobs.
- A cover frames the spread on all four sides — a visible border of
  worn leather or board, with the spread inset within it.
- Stacked page edges are visible along the top, bottom and fore
  edges, giving the book thickness.
- A gutter shadow runs down the centre where the pages meet.
- Aged paper: warm parchment, subtle grain, foxing, darker and more
  worn toward the edges.
- Warm directional light from above, falling off at the corners.
- Content sits ON the page: real shadows, no flat borders.

### Structure of the book

Front to back:

1. **The Index** — table of contents. Lists every game in the
   `games` table, each turning to that game's spread. Creating a new
   game happens here: adding a title to the contents. This is the
   landing page.

2. **One spread per game.**
   - Left page: the game's name as a heading. Beneath it, the
     recording section — where a new entry is written directly into
     the ledger. Beneath that, the record: past entries by date,
     each selectable. Beneath that, the tally for this game — wins
     per player at this game only.
   - Right page: a viewer for the selected entry. Photo if one
     exists, optional description below it. Selecting a different
     date on the left changes the right page.

3. **The Summary** — final spread. Left page: the leaderboard, wins
   per player across all games. Right page: per-game statistics —
   times played, who has won it most, when it was last played.

### Navigation

- Page turns move sequentially through the book.
- Bookmarks at the fore edge jump directly to a game's spread.
  Rendered from the `games` table, never hardcoded. They must read
  as physical markers, not as coloured tabs: emerging from the
  binding, draping over the page edge, with a notched end and a soft
  shadow beneath.
- Both must be reachable by keyboard and by swipe on touch.

### Page turning

- A CSS 3D transform about the spine: perspective on the container,
  rotateY on the leaf, transform-origin at the gutter.
- Forward and back both work.
- Respects `prefers-reduced-motion`: the turn becomes an instant
  change, never a partial animation.
- The page must remain readable mid-turn on slow devices. If the
  animation cannot be made smooth, correctness wins.

### Mobile

A two-page spread cannot work on a phone. On narrow viewports the
spread becomes one page at a time, with the same cover, edges and
turning. The left and right pages of a spread become consecutive
pages. This is a layout adaptation, not a different design.

### The inscription

When a winner is recorded, their name is burned into the page.

- Text reveals left to right with a hot glowing leading edge.
- A faint scorch settles behind the stroke as it passes.
- Roughly 1.2s, then rests as ordinary ink. Must not loop.
- Fires only on a genuinely new record, never on page load — a book
  does not re-inscribe itself when reopened.
- The name is present and legible in the DOM before, during and
  after. The animation is decoration over real text.
- Honors `prefers-reduced-motion`: the name simply appears.

### Language

The vocabulary of an archive, never of software.

- "Standings" → "The Tally"
- "Add a session" → "Record an entry"
- Empty states read as absence of record: "Nothing has been
  recorded here yet."
- Never: dashboard, submit, item, data, entry count.

### Non-negotiables

- Legibility beats atmosphere every time. Used at a table, on a
  phone, in bad light.
- Ornament lives at the edges. The centre of the page stays clean.
- No decorative element may block a tap target.
- Do not imitate any specific published game's art, nor any named
  illustrator's style.

## Schema changes required

`sessions` gains two nullable columns:

- `photo_url text` — path in Supabase Storage, null when no photo
- `description text` — optional note, null when absent

Photos live in a Supabase Storage bucket, not in the database.
The right page must be designed for the no-photo case, which is
the common case.

## Build order

1. The book object — cover, spread, edges, gutter, light
2. The Index, with new-game creation
3. Game spreads: record, inline recording, per-game tally
4. Photo upload and the right-page viewer
5. The Summary spread
6. Bookmarks as physical ribbons
7. Page turning
8. The inscription

Each stage ships independently and leaves the app fully usable.
