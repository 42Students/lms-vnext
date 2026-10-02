import {
  migrateDatabase,
  requireDatabaseUrl,
} from "./db-lib";

await migrateDatabase(requireDatabaseUrl());
process.stdout.write("Database migrations applied.\n");
