import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerEnv } from "@/lib/env";

type DbState = {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

const globalForDb = globalThis as typeof globalThis & {
  __lmsDb?: DbState;
};

const state = globalForDb.__lmsDb ?? {};

if (process.env.NODE_ENV !== "production") {
  globalForDb.__lmsDb = state;
}

export function getDb() {
  if (state.db) {
    return state.db;
  }

  const { DATABASE_URL } = getServerEnv();

  state.pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  state.db = drizzle(state.pool);
  return state.db;
}
