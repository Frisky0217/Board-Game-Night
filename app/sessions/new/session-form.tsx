"use client";

import { useActionState, useState } from "react";

import type { Game, Player } from "@/lib/types";

import { createSession, type State } from "./actions";

// Lives here rather than in actions.ts: a "use server" module may only export
// async functions, so it cannot export a plain constant.
const initialState: State = { status: "idle", message: "", formKey: "initial" };

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const fieldClass =
  "edge-soft h-12 w-full border border-foreground/15 bg-surface px-4 text-base " +
  "outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";

export function SessionForm({
  games,
  players,
}: {
  games: Game[];
  players: Player[];
}) {
  const [state, formAction, pending] = useActionState(
    createSession,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* formKey changes only on success, so this remount clears the
          controlled checkbox, winner and new-player state all at once —
          while a validation failure leaves the user's input untouched. */}
      <SessionFields
        key={state.formKey}
        games={games}
        players={players}
        pending={pending}
      />

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={pending}
          className="edge-pill h-12 w-full bg-accent px-6 text-base font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save session"}
        </button>

        {/* Rendered outside the keyed subtree so the confirmation survives the
            remount that clears the form. */}
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm text-rust"
              : "text-sm text-accent"
          }
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}

function SessionFields({
  games,
  players,
  pending,
}: {
  games: Game[];
  players: Player[];
  pending: boolean;
}) {
  const [gameId, setGameId] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [winners, setWinners] = useState<number[]>([]);
  const [newPlayers, setNewPlayers] = useState<
    { name: string; won: boolean }[]
  >([]);
  const [draftName, setDraftName] = useState("");

  function togglePlayed(id: number) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setWinners((prev) => prev.filter((x) => x !== id));
  }

  function toggleWinner(id: number) {
    setWinners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addPlayer() {
    const name = draftName.trim();
    if (!name) return;

    const taken =
      players.some((p) => p.name.toLowerCase() === name.toLowerCase()) ||
      newPlayers.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (taken) return;

    setNewPlayers((prev) => [...prev, { name, won: false }]);
    setDraftName("");
  }

  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Date</span>
        <input
          type="date"
          name="played_on"
          // Filled in on mount rather than during render: the server renders an
          // empty value, so there is nothing to mismatch on hydration, and the
          // date comes from the phone's clock instead of a UTC server.
          ref={(node) => {
            if (node && !node.value) node.value = todayLocal();
          }}
          disabled={pending}
          className={fieldClass}
        />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Game</span>
          <select
            name="game_id"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            disabled={pending}
            className={fieldClass}
          >
            <option value="">Pick a game…</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
            <option value="__new__">+ New game…</option>
          </select>
        </label>

        {gameId === "__new__" && (
          <input
            type="text"
            name="new_game_name"
            placeholder="Name of the new game"
            autoFocus
            disabled={pending}
            className={fieldClass}
          />
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Who played</legend>

        {players.length === 0 && newPlayers.length === 0 && (
          <p className="text-sm text-foreground/60">
            No players yet — add the first one below.
          </p>
        )}

        {players.map((player) => {
          const isPlaying = checked.includes(player.id);
          return (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 border-b border-foreground/10 py-1"
            >
              <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="player_ids"
                  value={player.id}
                  checked={isPlaying}
                  onChange={() => togglePlayed(player.id)}
                  disabled={pending}
                  className="size-5 accent-accent"
                />
                <span className="text-base">{player.name}</span>
              </label>

              {isPlaying && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleWinner(player.id)}
                    aria-pressed={winners.includes(player.id)}
                    disabled={pending}
                    className={
                      "edge-pill h-10 shrink-0 px-4 text-sm font-medium transition-colors " +
                      (winners.includes(player.id)
                        ? "bg-gold text-background"
                        : "border border-foreground/15 bg-surface")
                    }
                  >
                    Won
                  </button>
                  {winners.includes(player.id) && (
                    <input
                      type="hidden"
                      name="winner_ids"
                      value={player.id}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {newPlayers.map((player, index) => (
          <div
            key={player.name}
            className="flex items-center justify-between gap-3 border-b border-foreground/10 py-1"
          >
            <span className="flex min-h-12 flex-1 items-center gap-3 text-base">
              {player.name}
              <span className="text-xs uppercase tracking-wide text-foreground/50">
                new
              </span>
            </span>

            <button
              type="button"
              onClick={() =>
                setNewPlayers((prev) =>
                  prev.map((p, i) => (i === index ? { ...p, won: !p.won } : p)),
                )
              }
              aria-pressed={player.won}
              disabled={pending}
              className={
                "edge-pill h-10 shrink-0 px-4 text-sm font-medium transition-colors " +
                (player.won
                  ? "bg-gold text-background"
                  : "border border-foreground/15 bg-surface")
              }
            >
              Won
            </button>

            <button
              type="button"
              onClick={() =>
                setNewPlayers((prev) => prev.filter((_, i) => i !== index))
              }
              disabled={pending}
              aria-label={`Remove ${player.name}`}
              className="h-10 shrink-0 px-2 text-lg text-foreground/50 hover:text-rust"
            >
              ×
            </button>

            <input type="hidden" name="new_player_names" value={player.name} />
            {player.won && (
              <input
                type="hidden"
                name="new_player_winners"
                value={player.name}
              />
            )}
          </div>
        ))}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlayer();
              }
            }}
            placeholder="Add someone new"
            disabled={pending}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={addPlayer}
            disabled={pending}
            className="edge-soft-b h-12 shrink-0 border border-foreground/15 bg-surface px-5 text-base font-medium"
          >
            Add
          </button>
        </div>
      </fieldset>
    </>
  );
}
