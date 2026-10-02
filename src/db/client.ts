import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import {
  getDatabaseConnectionConfig,
  getServerEnv,
} from "@/lib/env";

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

function poolConfig(): PoolConfig {
  const database = getDatabaseConnectionConfig(getServerEnv());
  const common = {
    max: database.max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };

  if (database.mode === "url") {
    return {
      ...common,
      connectionString: database.connectionString,
    };
  }

  return {
    ...common,
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database,
  };
}

function getPool() {
  state.pool ??= new Pool(poolConfig());
  return state.pool;
}

export function getDb() {
  state.db ??= drizzle(getPool());
  return state.db;
}

export async function checkDatabaseConnection() {
  const client = await getPool().connect();

  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
}

export async function closeDatabaseConnection() {
  if (state.pool) {
    await state.pool.end();
  }

  state.pool = undefined;
  state.db = undefined;
}
