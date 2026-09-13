import Link from "next/link";

import { formatWinRate } from "@/lib/format";
import { getStandings } from "@/lib/queries";

export const metadata = {
  title: "The Tally · The Archive",
};

export default async function TallyPage() {
  const standings = await getStandings();

  return (
    <>
      <h1 className="display-face mb-8 text-4xl font-semibold">The Tally</h1>

      {standings.length === 0 ? (
        <p className="text-base text-foreground/60">
          No hands have been recorded yet.{" "}
          <Link href="/sessions/new" className="text-accent underline">
            Record an entry
          </Link>{" "}
          to begin the tally.
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
              <th scope="col" className="py-2 text-right font-medium">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={row.id} className="border-b border-foreground/10">
                <th
                  scope="row"
                  className={
                    "min-h-12 py-3 text-left font-normal " +
                    // Only a genuine leader is emphasized: with everyone on
                    // zero wins there is nothing to celebrate.
                    (index === 0 && row.wins > 0 ? "font-medium text-gold" : "")
                  }
                >
                  {row.name}
                </th>
                <td className="py-3 text-right tabular-nums">{row.wins}</td>
                <td className="py-3 text-right tabular-nums text-foreground/70">
                  {row.played}
                </td>
                <td className="py-3 text-right tabular-nums text-foreground/70">
                  {formatWinRate(row.winRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
