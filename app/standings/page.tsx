import Link from "next/link";

import { formatWinRate } from "@/lib/format";
import { getStandings } from "@/lib/queries";

export const metadata = {
  title: "Standings · Game Night",
};

export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="w-full max-w-3xl px-6 py-10 sm:py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">
          Standings
        </h1>

        {standings.length === 0 ? (
          <p className="text-base opacity-60">
            No players yet —{" "}
            <Link href="/sessions/new" className="text-accent underline">
              add a session
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="border-b border-black/[.12] text-sm opacity-60 dark:border-white/[.16]">
                <th scope="col" className="py-2 text-left font-medium">
                  Player
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Wins
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Played
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Win rate
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-black/[.06] dark:border-white/[.1]"
                >
                  <th
                    scope="row"
                    className={
                      "min-h-12 py-3 text-left font-normal " +
                      // Only a genuine leader is emphasized: with everyone on
                      // zero wins there is nothing to celebrate.
                      (index === 0 && row.wins > 0
                        ? "font-medium text-accent"
                        : "")
                    }
                  >
                    {row.name}
                  </th>
                  <td className="py-3 text-right tabular-nums">{row.wins}</td>
                  <td className="py-3 text-right tabular-nums opacity-70">
                    {row.played}
                  </td>
                  <td className="py-3 text-right tabular-nums opacity-70">
                    {formatWinRate(row.winRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
