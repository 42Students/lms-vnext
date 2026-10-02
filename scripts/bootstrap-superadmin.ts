import { bootstrapSuperAdminWithRuntime } from "../src/modules/system-roles/runtime";

type Args = Record<string, string>;

function parseArgs(argv: string[]): Args {
  const result: Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    if (equalsIndex >= 0) {
      result[withoutPrefix.slice(0, equalsIndex)] = withoutPrefix.slice(
        equalsIndex + 1,
      );
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${withoutPrefix}`);
    }

    result[withoutPrefix] = next;
    index += 1;
  }

  return result;
}

function usage() {
  return [
    "Usage:",
    '  npm run bootstrap:superadmin -- --phone="+919876543210" --display-name="Platform Admin" [--email="admin@example.com"]',
    "",
    "The command is intentionally operator-only. It creates or resolves the",
    "Identity Platform identity, creates/reuses the canonical vNext user, and",
    "idempotently assigns the SUPER_ADMIN system role. There is no public API",
    "endpoint for bootstrap.",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const phoneE164 = args.phone;
  const displayName = args["display-name"];

  if (!phoneE164 || !displayName) {
    throw new Error(usage());
  }

  const result = await bootstrapSuperAdminWithRuntime({
    phoneE164,
    displayName,
    email: args.email,
  });

  process.stdout.write(
    `SUPER_ADMIN ready: user=${result.id} identityUid=${result.identityUid}\n`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
