import Link from "next/link";

import { formatPlayedOn } from "@/lib/format";
import { getSessions } from "@/lib/queries";

export const metadata = {
  title: "Sessions · Game Night",
};

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="w-full max-w-3xl px-6 py-10 sm:py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">Sessions</h1>

        {sessions.length === 0 ? (
          <p className="text-base opacity-60">
            No sessions yet —{" "}
            <Link href="/sessions/new" className="text-accent underline">
              add the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-2 border-b border-black/[.06] py-4 dark:border-white/[.1]"
              >
                <p className="text-sm opacity-60">
                  {formatPlayedOn(session.playedOn)} · {session.gameName}
                </p>

                {session.players.length === 0 ? (
                  <p className="text-base opacity-40">Nobody recorded</p>
                ) : (
                  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {session.players.map((player) => (
                      <li
                        key={player.id}
                        className={
                          player.won
                            ? "text-base font-medium text-accent"
                            : "text-base opacity-70"
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
      </main>
    </div>
  );
}
