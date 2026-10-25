import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import { SEED_IDS } from "./db-seed-data";
import { fileURLToPath } from "node:url";
import {
  requireDatabaseUrl,
  resetDatabase,
  seedDatabase,
} from "./db-lib";

function assertDestructiveTestTargetPreflight() {
  const guardPath = fileURLToPath(
    new URL("./db01-test-database-guard.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [guardPath], {
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(
      detail || "Destructive test database target preflight refused",
    );
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
}

/**
 * Integration scenarios use the seeded faculty identity as an expressly
 * assigned placement officer in both colleges. Persist the matching grants
 * only on the preflight-approved disposable TEST_DATABASE_URL.
 * The general seed stays least-privileged; production permissions still
 * reconstruct actual membership roles under transaction locks.
 */
async function grantPlacementIntegrationFixtureRoles(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    for (const membershipId of [
      SEED_IDS.facultyCollegeAMembership,
      SEED_IDS.facultyCollegeBMembership,
    ]) {
      await pool.query(
        `INSERT INTO membership_roles (membership_id, role)
         VALUES ($1, 'TPO')
         ON CONFLICT (membership_id, role) DO NOTHING`,
        [membershipId],
      );
    }
  } finally {
    await pool.end();
  }
}

async function main() {
  assertDestructiveTestTargetPreflight();
  const databaseUrl = requireDatabaseUrl("TEST_DATABASE_URL");
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
  await grantPlacementIntegrationFixtureRoles(databaseUrl);
  process.stdout.write("Test database reset, migrated, and seeded.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
