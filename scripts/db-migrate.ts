import {
  migrateDatabase,
  migrationPoolConfigFromEnv,
} from "./db-lib";

async function main() {
  await migrateDatabase(migrationPoolConfigFromEnv());
  process.stdout.write("Database migrations applied.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
