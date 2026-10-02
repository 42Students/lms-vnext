import {
  requireDatabaseUrl,
  resetDatabase,
  seedDatabase,
} from "./db-lib";

const databaseUrl = requireDatabaseUrl("TEST_DATABASE_URL");
await resetDatabase(databaseUrl);
await seedDatabase(databaseUrl);
process.stdout.write("Test database reset, migrated, and seeded.\n");
