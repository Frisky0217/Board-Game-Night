import Link from "next/link";
import { notFound } from "next/navigation";

import { Spread } from "@/app/book/spread";
import { SessionForm } from "@/app/sessions/new/session-form";
import { formatPlayedOn } from "@/lib/format";
import {
  getEntry,
  getGame,
  getGameTally,
  getPlayers,
  getSessions,
} from "@/lib/queries";

import { EntryViewer } from "./entry-viewer";

export default async function GameSpread({
  params,
  searchParams,
}: PageProps<"/games/[id]">) {
  const [{ id }, { entry }] = await Promise.all([params, searchParams]);

  const gameId = Number(id);
  if (!Number.isInteger(gameId) || gameId <= 0) notFound();

  const game = await getGame(gameId);
  if (!game) notFound();

  const [sessions, tally, players] = await Promise.all([
    getSessions({ gameId }),
    getGameTally(gameId),
    getPlayers(),
  ]);

  // The newest entry is what the book falls open at. A requested entry that
  // belongs to another game, or to nothing, quietly falls back to it rather
  // than erroring — the same forgiving behaviour ?game= has on the Chronicle.
  const requested = Number(Array.isArray(entry) ? entry[0] : entry);
  const selected =
    Number.isInteger(requested) && requested > 0
      ? ((await getEntry(requested, gameId)) ??
        (sessions[0] ? await getEntry(sessions[0].id, gameId) : null))
      : sessions[0]
        ? await getEntry(sessions[0].id, gameId)
        : null;

  return (
    <Spread
      chapter={`game:${gameId}`}
      left={
        <>
          <h1 className="display-face text-4xl font-semibold">{game.name}</h1>

          <section className="mt-8">
            <h2 className="display-face mb-4 text-xl font-semibold">
              Record an entry
            </h2>
            <SessionForm games={[game]} players={players} fixedGame={game} />
          </section>

          <section className="mt-10">
            <h2 className="display-face mb-4 text-xl font-semibold">
              The record
            </h2>
            {sessions.length === 0 ? (
              <p className="text-base text-foreground/60">
                Nothing has been recorded here yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => {
                  const isSelected = selected?.id === session.id;
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/games/${gameId}?entry=${session.id}`}
                        scroll={false}
                        aria-current={isSelected ? "true" : undefined}
                        className={
                          "flex min-h-12 items-baseline gap-2 py-1 text-base transition-colors " +
                          (isSelected
                            ? "text-accent"
                            : "hover:text-accent text-foreground/80")
                        }
                      >
                        <span className="shrink-0">
                          {formatPlayedOn(session.playedOn)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="min-w-4 flex-1 translate-y-[-0.25rem] border-b border-dotted border-foreground/30"
                        />
                        <span className="shrink-0 text-sm text-foreground/55">
                          {session.players.filter((p) => p.won).length > 0
                            ? session.players
                                .filter((p) => p.won)
                                .map((p) => p.name)
                                .join(", ")
                            : "—"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="display-face mb-4 text-xl font-semibold">
              The tally
            </h2>
            {tally.length === 0 ? (
              <p className="text-base text-foreground/60">
                No hands have been recorded at this game.
              </p>
            ) : (
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className="border-b border-foreground/15 text-sm text-foreground/60">
                    <th scope="col" className="py-2 text-left font-medium">
                      Player
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Won
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Played
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tally.map((row, index) => (
                    <tr key={row.id} className="border-b border-foreground/10">
                      <th
                        scope="row"
                        className={
                          "py-3 text-left font-normal " +
                          (index === 0 && row.wins > 0
                            ? "font-medium text-gold"
                            : "")
                        }
                      >
                        {row.name}
                      </th>
                      <td className="py-3 text-right tabular-nums">
                        {row.wins}
                      </td>
                      <td className="py-3 text-right tabular-nums text-foreground/70">
                        {row.played}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      }
      right={<EntryViewer entry={selected} />}
    />
  );
}
