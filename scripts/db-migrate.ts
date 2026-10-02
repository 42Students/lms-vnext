import {
  migrateDatabase,
  migrationPoolConfigFromEnv,
} from "./db-lib";
import {
  logError,
  writeStructuredLog,
} from "../src/observability/logger";

async function main() {
  writeStructuredLog("INFO", "database.migration_started", {
    component: "migration",
  });

  await migrateDatabase(migrationPoolConfigFromEnv());

  writeStructuredLog("INFO", "database.migration_completed", {
    component: "migration",
  });
}

main().catch((error) => {
  logError("database.migration_failed", error, {
    component: "migration",
  });
  process.exitCode = 1;
});
