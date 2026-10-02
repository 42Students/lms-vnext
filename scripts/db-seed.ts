import {
  requireDatabaseUrl,
  seedDatabase,
} from "./db-lib";

await seedDatabase(requireDatabaseUrl());
process.stdout.write("Deterministic development seed applied.\n");
