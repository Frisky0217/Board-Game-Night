"use server";

import { revalidatePath } from "next/cache";

import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";

export type State = {
  status: "idle" | "error" | "success";
  message: string;
  /**
   * Remount key for the form fields. It changes only on success, so a save
   * clears the form but a validation failure leaves everything the user typed
   * in place.
   */
  formKey: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Form values arrive as strings; ids are integers in Postgres. */
function toId(value: FormDataEntryValue): number | null {
  const parsed = Number(String(value).trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/** Names in the database may carry stray whitespace, so compare loosely. */
function fingerprint(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Server Actions are reachable by direct POST, so every rule the UI enforces is
 * re-checked here against untrusted FormData.
 */
export async function createSession(
  prev: State,
  formData: FormData,
): Promise<State> {
  // Echoes the incoming formKey so a rejected submission keeps its input.
  const fail = (message: string): State => ({
    status: "error",
    message,
    formKey: prev.formKey,
  });

  const playedOn = String(formData.get("played_on") ?? "").trim();
  const rawGameId = String(formData.get("game_id") ?? "").trim();

  const playerIds = formData.getAll("player_ids").map(toId);
  const winnerIdList = formData.getAll("winner_ids").map(toId);
  const newPlayerNames = formData
    .getAll("new_player_names")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const newPlayerWinners = new Set(
    formData
      .getAll("new_player_winners")
      .map((value) => fingerprint(String(value))),
  );

  if (!playedOn) return fail("Pick the date the session was played.");
  if (!isRealDate(playedOn)) return fail("That date isn't valid.");

  if (playerIds.includes(null) || winnerIdList.includes(null)) {
    return fail("That submission was malformed — reload and try again.");
  }
  const existingPlayerIds = playerIds as number[];
  const winnerIds = new Set(winnerIdList as number[]);

  // Titles enter the book through the Index, so a session can only name a game
  // that already exists.
  if (!rawGameId) return fail("Pick a game.");
  const gameId = toId(rawGameId);
  if (gameId === null) {
    return fail("That game selection was malformed — reload and try again.");
  }

  if (existingPlayerIds.length === 0 && newPlayerNames.length === 0) {
    return fail("Pick at least one player.");
  }

  for (const id of winnerIds) {
    if (!existingPlayerIds.includes(id)) {
      return fail("A winner was marked for someone who didn't play.");
    }
  }

  // De-duplicate new names case-insensitively within this submission.
  const seen = new Set<string>();
  const uniqueNewNames: string[] = [];
  for (const name of newPlayerNames) {
    if (seen.has(fingerprint(name))) return fail(`You added "${name}" twice.`);
    seen.add(fingerprint(name));
    uniqueNewNames.push(name);
  }

  for (const name of newPlayerWinners) {
    if (!seen.has(name)) {
      return fail("A winner was marked for someone who didn't play.");
    }
  }

  // Guard against creating a player that duplicates an existing row.
  if (uniqueNewNames.length > 0) {
    const { data, error } = await supabase.from("players").select("name");
    if (error) return fail(`Could not check existing players: ${error.message}`);

    const taken = new Set((data ?? []).map((row) => fingerprint(row.name)));
    const clash = uniqueNewNames.find((name) => taken.has(fingerprint(name)));
    if (clash) {
      return fail(`"${clash}" already exists — check them in the list instead.`);
    }
  }

  // 1. Create any new players, remembering which of them won.
  const played: { player_id: number; won: boolean }[] = existingPlayerIds.map(
    (id) => ({ player_id: id, won: winnerIds.has(id) }),
  );

  if (uniqueNewNames.length > 0) {
    const { data, error } = await supabase
      .from("players")
      .insert(uniqueNewNames.map((name) => ({ name })))
      .select("id, name")
      .overrideTypes<Player[], { merge: false }>();

    if (error || !data) {
      return fail(
        `Could not create the new players: ${error?.message ?? "unknown error"}`,
      );
    }

    for (const player of data) {
      played.push({
        player_id: player.id,
        won: newPlayerWinners.has(fingerprint(player.name)),
      });
    }
  }

  // 2. Create the session.
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({ played_on: playedOn, game_id: gameId })
    .select("id")
    .single<{ id: number }>();

  if (sessionError || !session) {
    return fail(
      `Could not save the session: ${sessionError?.message ?? "unknown error"}`,
    );
  }

  // 3. Create one result row per player who played.
  const { error: resultsError } = await supabase
    .from("results")
    .insert(played.map((row) => ({ session_id: session.id, ...row })));

  if (resultsError) {
    // No transactions over the REST API, so roll the session back by hand.
    // RLS *filters* deletes rather than erroring, so a denied delete comes back
    // as "no error, nothing removed" — ask for the deleted ids to tell the two
    // apart instead of trusting the absence of an error.
    const { data: removed } = await supabase
      .from("sessions")
      .delete()
      .eq("id", session.id)
      .select("id");

    const rolledBack = (removed?.length ?? 0) > 0;

    return fail(
      rolledBack
        ? `Could not save who played: ${resultsError.message}. Nothing was recorded — try again.`
        : `Could not save who played: ${resultsError.message}. An empty session may have been left behind (id ${session.id}).`,
    );
  }

  // Without Cache Components this route is prerendered, so newly created games
  // and players would not show up in the lists until the next build. The other
  // two pages are request-time rendered, but revalidating them drops any stale
  // payload the client router is holding.
  revalidatePath("/sessions/new");
  revalidatePath("/sessions");
  revalidatePath("/standings");
  // The Index shows how many nights each title holds, so it changes too.
  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);

  const winnerCount = played.filter((row) => row.won).length;
  return {
    status: "success",
    message:
      winnerCount === 0
        ? `Saved — ${played.length} played, no winner recorded.`
        : `Saved — ${played.length} played, ${winnerCount} won.`,
    formKey: crypto.randomUUID(),
  };
}
