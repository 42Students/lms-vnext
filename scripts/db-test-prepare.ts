import {
  requireDatabaseUrl,
  resetDatabase,
  seedDatabase,
} from "./db-lib";

async function main() {
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
