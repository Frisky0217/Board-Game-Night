import { getGames, getPlayers } from "@/lib/queries";

import { SessionForm } from "./session-form";

export const metadata = {
  title: "Record an entry · The Archive",
};

export default async function RecordEntryPage() {
  const [games, players] = await Promise.all([getGames(), getPlayers()]);

  return (
    <>
      <h1 className="display-face mb-8 text-4xl font-semibold">
        Record an entry
      </h1>
      <SessionForm games={games} players={players} />
    </>
  );
}
