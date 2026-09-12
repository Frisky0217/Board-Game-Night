import { getGames, getPlayers } from "@/lib/queries";

import { SessionForm } from "./session-form";

export const metadata = {
  title: "Add a session · Game Night",
};

export default async function NewSessionPage() {
  const [games, players] = await Promise.all([getGames(), getPlayers()]);

  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="w-full max-w-3xl px-6 py-10 sm:py-16">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">
          Add a session
        </h1>
        <SessionForm games={games} players={players} />
      </main>
    </div>
  );
}
