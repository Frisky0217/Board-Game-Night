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

## Design direction: The Archive

The app is not a website styled like a book. The app _is_ a book — a
sacred, aged archive in which the history of game nights is recorded.
Every screen is a page of it. Every interaction is something you do
to a book: turning a page, following a ribbon, watching an entry
be inscribed.

This metaphor governs layout, language, and motion. When a design
decision is unclear, the question is "what would this be, in a book?"

### The physical object

- Single page, not a two-page spread. The spine sits at the left edge
  with a soft gutter shadow. This keeps mobile usable.
- The page rests on a dark surface. Three layers only: surface,
  book edge, page.
- Aged paper: warm parchment, subtle grain, foxing, darker and
  more worn toward the edges.
- Warm directional light from above, falling off at the corners.
  This is what makes it a place rather than a texture.
- Content sits ON the page: real shadows, no flat borders.

### Language

Chrome uses the vocabulary of an archive, never of software.

- "Add a session" → "Record an entry"
- "Standings" → "The Tally"
- "Sessions" → "The Chronicle"
- Empty states read as absence of record, not absence of data:
  "Nothing has been recorded here yet."
- Never: dashboard, submit, item, data, entry count.

### Bookmarks — ribbons per game

Ribbons hang down the right edge of the page, one per game in the
`games` table, rendered from the database — never hardcoded.

- Clicking a ribbon turns to that game's section: the chronicle
  filtered to that game.
- The active ribbon is pulled out further and brighter.
- Ribbons must degrade gracefully: 3 games looks deliberate,
  15 must scroll or stack without breaking the page.

### Page turning

- Turning is a CSS 3D transform about the spine: perspective on the
  container, rotateY on the leaf, transform-origin at the left edge.
- One page = one session in the chronicle. The Tally is its own page.
- Forward and back must both work, and must be reachable by keyboard
  and by swipe on touch.
- Respect `prefers-reduced-motion`: the turn becomes an instant
  change, never a jarring partial animation.
- The page must remain readable mid-turn on slow devices. If the
  animation cannot be made smooth, correctness wins.

### The inscription

When a winner is recorded, their name is burned into the page.

- Text reveals left to right with a hot glowing leading edge.
- A faint scorch settles behind the stroke as it passes.
- Roughly 1.2s, then it rests as ordinary ink. It must not loop.
- Fires only on a genuinely new record, never on every page load —
  a book does not re-inscribe itself when reopened.
- The name must be present and legible in the DOM before, during,
  and after. The animation is decoration over real text, never a
  replacement for it.
- Honors `prefers-reduced-motion`: the name simply appears.

### Non-negotiables

- Legibility beats atmosphere every time. This gets used at a table,
  on a phone, in bad light.
- Ornament lives at the edges. The centre of the page stays clean.
- No decorative element may block a tap target.
- Do not imitate any specific published game's art, nor any named
  illustrator's style.

### Build order

1. Ribbons (bookmarks per game) — filtering already works
2. Inscription on the Tally leader
3. Page turning — highest risk, last

Each stage ships independently and must leave the app fully usable.
