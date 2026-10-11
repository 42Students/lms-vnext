import { spawnSync } from "node:child_process";
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

async function main() {
  assertDestructiveTestTargetPreflight();
  const databaseUrl = requireDatabaseUrl("TEST_DATABASE_URL");
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
  process.stdout.write("Test database reset, migrated, and seeded.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
