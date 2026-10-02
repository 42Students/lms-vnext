import {
  migrateDatabase,
  requireDatabaseUrl,
} from "./db-lib";

async function main() {
  await migrateDatabase(requireDatabaseUrl());
  process.stdout.write("Database migrations applied.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
