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
