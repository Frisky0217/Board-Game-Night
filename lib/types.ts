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
  gameId: number;
  gameName: string;
  players: SessionPlayer[];
};

/** The right page: one entry, viewed in full. */
export type EntryDetail = {
  id: number;
  /** Raw YYYY-MM-DD, formatted at render time. */
  playedOn: string;
  photoUrl: string | null;
  description: string | null;
  players: SessionPlayer[];
};

/** One line of a per-game tally. */
export type TallyRow = {
  id: number;
  name: string;
  wins: number;
  played: number;
};

/** One line of the Index: a title in the contents, and how many nights it holds. */
export type ContentsEntry = {
  id: number;
  name: string;
  nights: number;
};

export type StandingRow = {
  id: number;
  name: string;
  wins: number;
  played: number;
  /** null when the player has no recorded sessions, to avoid dividing by zero. */
  winRate: number | null;
};
