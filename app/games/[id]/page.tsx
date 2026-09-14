import { notFound } from "next/navigation";

import { formatPlayedOn } from "@/lib/format";
import { getGame, getSessions } from "@/lib/queries";

export default async function GamePage({ params }: PageProps<"/games/[id]">) {
  const { id } = await params;

  const gameId = Number(id);
  if (!Number.isInteger(gameId) || gameId <= 0) notFound();

  const game = await getGame(gameId);
  if (!game) notFound();

  const sessions = await getSessions({ gameId });

  return (
    <>
      <h1 className="display-face mb-8 text-4xl font-semibold">{game.name}</h1>

      {sessions.length === 0 ? (
        <p className="text-base text-foreground/60">
          Nothing has been recorded here yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="edge-soft on-page space-y-2 px-5 py-4"
            >
              <p className="text-sm text-foreground/60">
                {formatPlayedOn(session.playedOn)}
              </p>

              {session.players.length === 0 ? (
                <p className="text-base text-foreground/40">
                  No hands were recorded.
                </p>
              ) : (
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {session.players.map((player) => (
                    <li
                      key={player.id}
                      className={
                        player.won
                          ? "text-base font-medium text-gold"
                          : "text-base text-foreground/70"
                      }
                    >
                      {player.name}
                      {player.won && (
                        <span aria-label="won" className="ml-1">
                          ✓
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
