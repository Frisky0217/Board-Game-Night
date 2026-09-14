import { getGames, getPlayers } from "@/lib/queries";

import { SessionForm } from "./session-form";
import { Paginator } from "@/app/book/paginator";

export const metadata = {
  title: "Record an entry · The Archive",
};

export default async function RecordEntryPage() {
  const [games, players] = await Promise.all([getGames(), getPlayers()]);

  return (
    <Paginator>
      <h1 className="display-face mb-8 text-4xl font-semibold">
        Record an entry
      </h1>
      <SessionForm games={games} players={players} />
    </Paginator>
  );
}
