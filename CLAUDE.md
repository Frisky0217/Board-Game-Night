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

## Design direction

Clean and legible, mobile-first — this gets used at a table with
phones. Generous spacing, large tap targets, one accent
