import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import {
  Pool,
  type PoolClient,
  type PoolConfig,
} from "pg";
import {
  getDatabaseConnectionConfig,
  parseServerEnv,
} from "../src/lib/env";
import { SEED_IDS } from "./db-seed-data";

const migrationsFolder = path.resolve(process.cwd(), "drizzle");

export function requireDatabaseUrl(
  variableName: "DATABASE_URL" | "TEST_DATABASE_URL" = "DATABASE_URL",
) {
  const value = process.env[variableName];

  if (!value?.trim()) {
    throw new Error(
      `${variableName} is required for this database command`,
    );
  }

  return value;
}

export function migrationPoolConfigFromEnv(): PoolConfig {
  const env = parseServerEnv({
    DATABASE_URL: process.env.DATABASE_URL,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    INSTANCE_UNIX_SOCKET: process.env.INSTANCE_UNIX_SOCKET,
    DB_POOL_MAX: process.env.DB_POOL_MAX ?? "2",
  });
  const database = getDatabaseConnectionConfig(env);

  if (database.mode === "url") {
    return {
      connectionString: database.connectionString,
      max: Math.min(database.max, 2),
    };
  }

  return {
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database,
    max: Math.min(database.max, 2),
  };
}

function databaseName(databaseUrl: string) {
  return decodeURIComponent(
    new URL(databaseUrl).pathname.replace(/^\//, ""),
  );
}

export function assertResetAllowed(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const name = databaseName(databaseUrl);

  if (["postgres", "template0", "template1"].includes(name)) {
    throw new Error(
      `Refusing to reset protected PostgreSQL database: ${name}`,
    );
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (
    localHosts.has(parsed.hostname) ||
    process.env.ALLOW_DB_RESET === "true"
  ) {
    return;
  }

  throw new Error(
    "Refusing to reset a non-local database. Set ALLOW_DB_RESET=true only for a deliberate disposable environment.",
  );
}

export async function migrateDatabase(
  database: string | PoolConfig,
) {
  const pool = new Pool(
    typeof database === "string"
      ? { connectionString: database, max: 2 }
      : database,
  );

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

export async function resetDatabase(databaseUrl: string) {
  assertResetAllowed(databaseUrl);

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("CREATE SCHEMA public");
  } finally {
    await pool.end();
  }

  await migrateDatabase(databaseUrl);
}

async function upsertCoreSeed(client: PoolClient) {
  const ids = SEED_IDS;

  await client.query(
    `INSERT INTO organizations (id, name, status)
     VALUES ($1, 'Seed Organization', 'ACTIVE')
     ON CONFLICT (id) DO UPDATE
     SET name = EXCLUDED.name, status = 'ACTIVE', updated_at = now()`,
    [ids.organization],
  );

  await client.query(
    `INSERT INTO colleges (id, organization_id, name, code, city, state, country, status)
     VALUES
       ($1, $3, 'Seed College A', 'SEED-A', 'Vijayawada', 'Andhra Pradesh', 'India', 'ACTIVE'),
       ($2, $3, 'Seed College B', 'SEED-B', 'Hyderabad', 'Telangana', 'India', 'ACTIVE')
     ON CONFLICT (id) DO UPDATE
     SET organization_id = EXCLUDED.organization_id,
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         country = EXCLUDED.country,
         status = 'ACTIVE',
         updated_at = now()`,
    [ids.collegeA, ids.collegeB, ids.organization],
  );

  await client.query(
    `INSERT INTO departments (id, college_id, name)
     VALUES
       ($1, $3, 'Computer Science'),
       ($2, $4, 'Computer Science')
     ON CONFLICT (id) DO UPDATE
     SET college_id = EXCLUDED.college_id,
         name = EXCLUDED.name,
         archived_at = null,
         updated_at = now()`,
    [ids.departmentA, ids.departmentB, ids.collegeA, ids.collegeB],
  );

  const seedUsers = [
    [
      ids.superAdminUser,
      "seed-superadmin",
      "+919000000001",
      "superadmin.seed@example.com",
      "Seed Superadmin",
    ],
    [
      ids.collegeAdminUser,
      "seed-college-admin",
      "+919000000002",
      "collegeadmin.seed@example.com",
      "Seed College Admin",
    ],
    [
      ids.facultyUser,
      "seed-shared-faculty",
      "+919000000003",
      "faculty.seed@example.com",
      "Seed Shared Faculty",
    ],
    [
      ids.learnerUser,
      "seed-learner",
      "+919000000004",
      "learner.seed@example.com",
      "Seed Learner",
    ],
  ] as const;

  for (const [id, identityUid, phone, email, displayName] of seedUsers) {
    await client.query(
      `INSERT INTO users
         (id, identity_uid, phone_e164, email, display_name, platform_status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       ON CONFLICT (id) DO UPDATE
       SET identity_uid = EXCLUDED.identity_uid,
           phone_e164 = EXCLUDED.phone_e164,
           email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           platform_status = 'ACTIVE',
           updated_at = now()`,
      [id, identityUid, phone, email, displayName],
    );
  }

  await client.query(
    `INSERT INTO placement_seasons
       (id, college_id, name, code, start_date, end_date, status, created_by_user_id)
     VALUES
       ($1, $3, 'Seed 2026-27 Placements', 'SEED-2026-27-A', '2026-07-01', '2027-06-30', 'ACTIVE', $5),
       ($2, $4, 'Seed 2026-27 Placements', 'SEED-2026-27-B', '2026-07-01', '2027-06-30', 'ACTIVE', $5)
     ON CONFLICT (id) DO UPDATE
     SET college_id = EXCLUDED.college_id,
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         status = 'ACTIVE',
         closed_by_user_id = null,
         closed_at = null,
         updated_at = now()`,
    [
      ids.placementSeasonA,
      ids.placementSeasonB,
      ids.collegeA,
      ids.collegeB,
      ids.collegeAdminUser,
    ],
  );

  await client.query(
    `INSERT INTO system_roles (id, user_id, role)
     VALUES ($1, $2, 'SUPER_ADMIN')
     ON CONFLICT (user_id, role) DO NOTHING`,
    [ids.systemRole, ids.superAdminUser],
  );

  const memberships = [
    [
      ids.collegeAdminMembership,
      ids.collegeAdminUser,
      ids.collegeA,
    ],
    [
      ids.facultyCollegeAMembership,
      ids.facultyUser,
      ids.collegeA,
    ],
    [
      ids.facultyCollegeBMembership,
      ids.facultyUser,
      ids.collegeB,
    ],
    [
      ids.learnerCollegeAMembership,
      ids.learnerUser,
      ids.collegeA,
    ],
  ] as const;

  for (const [id, userId, collegeId] of memberships) {
    await client.query(
      `INSERT INTO college_memberships
         (id, user_id, college_id, status)
       VALUES ($1, $2, $3, 'ACTIVE')
       ON CONFLICT (id) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           college_id = EXCLUDED.college_id,
           status = 'ACTIVE',
           suspended_at = null,
           suspension_reason = null,
           updated_at = now()`,
      [id, userId, collegeId],
    );
  }

  const roles = [
    [
      ids.collegeAdminRole,
      ids.collegeAdminMembership,
      "COLLEGE_ADMIN",
    ],
    [
      ids.facultyCollegeARole,
      ids.facultyCollegeAMembership,
      "FACULTY",
    ],
    [
      ids.facultyCollegeAMentorRole,
      ids.facultyCollegeAMembership,
      "MENTOR",
    ],
    [
      ids.facultyCollegeBRole,
      ids.facultyCollegeBMembership,
      "FACULTY",
    ],
    [
      ids.learnerCollegeARole,
      ids.learnerCollegeAMembership,
      "LEARNER",
    ],
  ] as const;

  for (const [id, membershipId, role] of roles) {
    await client.query(
      `INSERT INTO membership_roles (id, membership_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (membership_id, role) DO NOTHING`,
      [id, membershipId, role],
    );
  }

  await client.query(
    `INSERT INTO faculty_profiles
       (membership_id, primary_department_id, employment_type, academic_title)
     VALUES ($1, $2, 'FULL_TIME', 'Assistant Professor')
     ON CONFLICT (membership_id) DO UPDATE
     SET primary_department_id = EXCLUDED.primary_department_id,
         employment_type = EXCLUDED.employment_type,
         academic_title = EXCLUDED.academic_title,
         updated_at = now()`,
    [ids.facultyCollegeAMembership, ids.departmentA],
  );

  await client.query(
    `INSERT INTO learner_profiles
       (membership_id, roll_number, registration_number)
     VALUES ($1, 'SEED-L-001', 'SEED-REG-001')
     ON CONFLICT (membership_id) DO UPDATE
     SET roll_number = EXCLUDED.roll_number,
         registration_number = EXCLUDED.registration_number,
         updated_at = now()`,
    [ids.learnerCollegeAMembership],
  );
}

export async function seedDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await upsertCoreSeed(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
