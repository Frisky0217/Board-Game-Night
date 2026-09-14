import { cache } from "react";

import { connection } from "next/server";

import { supabase } from "@/lib/supabase";
import type {
  Game,
  Player,
  SessionSummary,
  StandingRow,
} from "@/lib/types";

/**
 * The client is created without a `Database` generic, so postgrest-js types
 * every embedded resource as an array — including to-one embeds like `games`,
 * which actually arrive as a bare object. That makes `.overrideTypes` on nested
 * selects load-bearing rather than cosmetic: it is the only schema contract in
 * the codebase, and it is a pure compile-time cast with no runtime validation.
 * Both shapes below were verified against the live database.
 */
type SessionFeedRow = {
  id: number;
  played_on: string;
  game_id: number;
  games: { name: string } | null;
  results: { won: boolean; players: { id: number; name: string } | null }[];
};

type StandingsQueryRow = {
  id: number;
  name: string;
  results: { won: boolean }[];
};

/** Stored names can carry stray whitespace (e.g. "Catan\n"). */
function clean(name: string | undefined | null) {
  return (name ?? "").trim();
}

/**
 * Cache Components is off, so a page reading these would otherwise be
 * prerendered at build time — which both couples `next build` to Supabase being
 * reachable and freezes the lists when rows change outside the app (e.g. edited
 * directly in Supabase Studio). Opting into request-time rendering here means
 * every page that reads game night data inherits it.
 */
/**
 * Wrapped in React `cache` so that routes needing the game list more than once
 * per request — the chronicle resolving `?game=`, the record form populating
 * its select — issue one query rather than several.
 */
export const getGames = cache(async function getGames(): Promise<Game[]> {
  await connection();

  const { data, error } = await supabase
    .from("games")
    .select("id, name")
    .order("name");

  if (error) throw new Error(`Could not load games: ${error.message}`);
  return (data ?? []).map((game) => ({ id: game.id, name: clean(game.name) }));
});

export async function getPlayers(): Promise<Player[]> {
  await connection();

  const { data, error } = await supabase
    .from("players")
    .select("id, name")
    .order("name");

  if (error) throw new Error(`Could not load players: ${error.message}`);
  return data ?? [];
}

/**
 * Past sessions, newest first, with the game and everyone who played.
 * Pass `gameId` to narrow the chronicle to one game's section.
 */
export async function getSessions(
  options: { gameId?: number } = {},
): Promise<SessionSummary[]> {
  await connection();

  let query = supabase
    .from("sessions")
    .select("id, played_on, game_id, games(name), results(won, players(id, name))")
    .order("played_on", { ascending: false })
    // played_on is a date, so same-day sessions would otherwise come back in
    // arbitrary order.
    .order("id", { ascending: false });

  if (options.gameId !== undefined) {
    query = query.eq("game_id", options.gameId);
  }

  // overrideTypes returns the base builder, so it has to come last.
  const { data, error } = await query.overrideTypes<
    SessionFeedRow[],
    { merge: false }
  >();

  if (error) throw new Error(`Could not load sessions: ${error.message}`);

  return (data ?? []).map((session) => ({
    id: session.id,
    playedOn: session.played_on,
    gameId: session.game_id,
    gameName: clean(session.games?.name) || "Unknown game",
    players: session.results
      .flatMap((result) =>
        result.players
          ? [
              {
                id: result.players.id,
                name: clean(result.players.name),
                won: result.won,
              },
            ]
          : [],
      )
      .sort(
        (a, b) =>
          Number(b.won) - Number(a.won) || a.name.localeCompare(b.name),
      ),
  }));
}

/** Wins per player. */
export async function getStandings(): Promise<StandingRow[]> {
  await connection();

  // Anchored on `players` with a plain embed so that players with no results —
  // and players who have played but never won — are still returned. Using
  // `results!inner(won)` or filtering on `results.won` would drop them.
  const { data, error } = await supabase
    .from("players")
    .select("id, name, results(won)")
    .order("name")
    .overrideTypes<StandingsQueryRow[], { merge: false }>();

  if (error) throw new Error(`Could not load standings: ${error.message}`);

  return (data ?? [])
    .map((player) => {
      const played = player.results.length;
      const wins = player.results.filter((result) => result.won).length;
      return {
        id: player.id,
        name: clean(player.name),
        wins,
        played,
        winRate: played === 0 ? null : wins / played,
      };
    })
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        (b.winRate ?? -1) - (a.winRate ?? -1) ||
        a.name.localeCompare(b.name),
    );
}
