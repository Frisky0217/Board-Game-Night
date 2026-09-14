import Link from "next/link";

import { formatPlayedOn } from "@/lib/format";
import { getGames, getSessions } from "@/lib/queries";

import { Paginator } from "@/app/book/paginator";

export const metadata = {
  title: "The Chronicle · The Archive",
};

export default async function ChroniclePage({
  searchParams,
}: PageProps<"/sessions">) {
  const { game } = await searchParams;

  // Resolve the requested section against the real games. Anything
  // unparseable or unknown reads as no bookmark rather than an error.
  const requestedId = Number(Array.isArray(game) ? game[0] : game);
  const games = await getGames();
  const section =
    Number.isInteger(requestedId) && requestedId > 0
      ? (games.find((candidate) => candidate.id === requestedId) ?? null)
      : null;

  const sessions = await getSessions(
    section ? { gameId: section.id } : undefined,
  );

  return (
    <Paginator>
      <h1 className="display-face mb-8 text-4xl font-semibold">
        The Chronicle
        {section && (
          <span className="text-foreground/55"> · {section.name}</span>
        )}
      </h1>

      {sessions.length === 0 ? (
        <p className="text-base text-foreground/60">
          Nothing has been recorded here yet.{" "}
          <Link href="/sessions/new" className="text-accent underline">
            Record an entry
          </Link>
          .
        </p>
      ) : (
        /* Block flow so the record can fragment across pages instead of being
           clipped — a column flex container does not fragment reliably. */
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="edge-soft on-page space-y-2 px-5 py-4"
            >
              <p className="text-sm text-foreground/60">
                {formatPlayedOn(session.playedOn)} · {session.gameName}
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
    </Paginator>
  );
}
