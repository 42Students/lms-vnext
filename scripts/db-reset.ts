import {
  requireDatabaseUrl,
  resetDatabase,
  seedDatabase,
} from "./db-lib";

const databaseUrl = requireDatabaseUrl();
await resetDatabase(databaseUrl);
await seedDatabase(databaseUrl);
process.stdout.write("Database reset, migrated, and seeded.\n");
