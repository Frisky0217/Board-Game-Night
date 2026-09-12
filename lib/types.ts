// Ids are bigint/serial in Postgres, so PostgREST returns them as JSON numbers.
export type Player = {
  id: number;
  name: string;
};

export type Game = {
  id: number;
  name: string;
};

export type SessionRow = {
  id: number;
  played_on: string;
  game_id: number;
};

export type Result = {
  id: number;
  session_id: number;
  player_id: number;
  won: boolean;
};

// View models. The pages consume these rather than raw join output, so all the
// reshaping lives in lib/queries.ts.

export type SessionPlayer = {
  id: number;
  name: string;
  won: boolean;
};

export type SessionSummary = {
  id: number;
  /** Raw YYYY-MM-DD, formatted at render time. */
  playedOn: string;
  gameName: string;
  players: SessionPlayer[];
};

export type StandingRow = {
  id: number;
  name: string;
  wins: number;
  played: number;
  /** null when the player has no recorded sessions, to avoid dividing by zero. */
  winRate: number | null;
};
