import {
  requireDatabaseUrl,
  seedDatabase,
} from "./db-lib";

async function main() {
  await seedDatabase(requireDatabaseUrl());
  process.stdout.write("Deterministic development seed applied.\n");
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
