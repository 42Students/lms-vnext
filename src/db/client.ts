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
    const result = await client.query<{
      organizations: string | null;
      users: string | null;
      memberships: string | null;
      programs: string | null;
      academicPeriods: string | null;
      cohorts: string | null;
      sections: string | null;
    }>(
      `select
         to_regclass('public.organizations')::text as organizations,
         to_regclass('public.users')::text as users,
         to_regclass('public.college_memberships')::text as memberships,
         to_regclass('public.programs')::text as "programs",
         to_regclass('public.academic_periods')::text as "academicPeriods",
         to_regclass('public.cohorts')::text as "cohorts",
         to_regclass('public.sections')::text as "sections"`,
    );

    const schema = result.rows[0];
    if (
      !schema?.organizations ||
      !schema.users ||
      !schema.memberships ||
      !schema.programs ||
      !schema.academicPeriods ||
      !schema.cohorts ||
      !schema.sections
    ) {
      throw new Error(
        "Database schema is not fully migrated",
      );
    }
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
