import { connection } from "next/server";

import { supabase } from "@/lib/supabase";
import type { Game, Player } from "@/lib/types";

/**
 * Cache Components is off, so a page reading these would otherwise be
 * prerendered at build time — which both couples `next build` to Supabase being
 * reachable and freezes the lists when rows change outside the app (e.g. edited
 * directly in Supabase Studio). Opting into request-time rendering here means
 * every page that reads game night data inherits it.
 */
export async function getGames(): Promise<Game[]> {
  await connection();

  const { data, error } = await supabase
    .from("games")
    .select("id, name")
    .order("name");

  if (error) throw new Error(`Could not load games: ${error.message}`);
  return data ?? [];
}

export async function getPlayers(): Promise<Player[]> {
  await connection();

  const { data, error } = await supabase
    .from("players")
    .select("id, name")
    .order("name");

  if (error) throw new Error(`Could not load players: ${error.message}`);
  return data ?? [];
}
