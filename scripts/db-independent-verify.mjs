import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";
import { assertSafeDb01TestTarget } from "./db01-test-database-guard.mjs";
import { redactVerifierOutput } from "./db-independent-verifier-redaction.mjs";
import { inspectCanonicalGenerationOutput } from "./db-independent-verifier-generation-guard.mjs";

const postgresImage =
  process.env.DB_VERIFY_POSTGRES_IMAGE ?? "postgres:17-alpine";
const containerName =
  process.env.DB_VERIFY_CONTAINER_NAME ??
  `lms-vnext-pg-verify-${process.pid}`;
const evidencePath = resolve(
  process.env.DB_VERIFY_EVIDENCE_PATH ??
    `.verification/db-independent-${new Date()
      .toISOString()
      .replaceAll(":", "-")}.json`,
);

const results = [];
let dockerStarted = false;
let databaseUrl = process.env.TEST_DATABASE_URL ?? null;

function shellText(command, args = [], env = process.env) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      redactVerifierOutput(`${command} ${args.join(" ")} failed (${result.status})\n${result.stderr || result.stdout}`),
    );
  }
  return (result.stdout || result.stderr || "").trim();
}

function outputTail(value, maxLines = 80) {
  const lines = String(value ?? "").split(/\r?\n/);
  return lines.slice(-maxLines).join("\n");
}

function runEmptyOutputStep(name, command, args, env) {
  const startedAt = new Date().toISOString();
  process.stdout.write(
    `\n=== ${name} ===\n$ ${command} ${args.join(" ")}\n`,
  );
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  process.stdout.write(redactVerifierOutput(stdout));
  process.stderr.write(redactVerifierOutput(stderr));
  const combined = `${stdout}\n${stderr}`;
  const unexpectedOutput = stdout.trim();
  const record = {
    name,
    command: [command, ...args],
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal ?? null,
    outputSha256: createHash("sha256").update(combined).digest("hex"),
    outputTail: outputTail(redactVerifierOutput(combined)),
    expectedEmptyStdout: true,
    stdoutWasEmpty: unexpectedOutput.length === 0,
  };
  results.push(record);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status}`);
  }
  if (unexpectedOutput) {
    throw new Error(
      redactVerifierOutput(`${name} found unregistered files:\n${unexpectedOutput}`),
    );
  }
}

function runStep(name, command, args, env) {
  const startedAt = new Date().toISOString();
  process.stdout.write(
    `\n=== ${name} ===\n$ ${command} ${args.join(" ")}\n`,
  );
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  process.stdout.write(redactVerifierOutput(stdout));
  process.stderr.write(redactVerifierOutput(stderr));
  const combined = `${stdout}\n${stderr}`;
  const canonicalGeneration =
    name === "Canonical Drizzle generation"
      ? inspectCanonicalGenerationOutput({ stdout, stderr })
      : null;
  const record = {
    name,
    command: [command, ...args],
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal ?? null,
    outputSha256: createHash("sha256").update(combined).digest("hex"),
    outputTail: outputTail(redactVerifierOutput(combined)),
    ...(canonicalGeneration ? { canonicalGeneration } : {}),
  };
  results.push(record);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status}`);
  }
  if (canonicalGeneration && !canonicalGeneration.passed) {
    // drizzle-kit can print fatal TypeError stacks while exiting successfully.
    // Later clean-diff checks cannot retroactively prove generation completed.
    throw new Error(
      "Canonical Drizzle generation emitted diagnostics despite exit code 0; schema drift certification refused",
    );
  }
}

async function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a local PostgreSQL port"));
        return;
      }
      const port = address.port;
      server.close((error) => {
        if (error) reject(error);
        else resolvePort(port);
      });
    });
  });
}

async function startDockerPostgres() {
  const dockerVersion = shellText("docker", [
    "version",
    "--format",
    "{{.Server.Version}}",
  ]);
  const port = await findFreePort();
  const password = `verify-${process.pid}`;
  const dbName = `lms_vnext_test_${process.pid}`;

  shellText("docker", [
    "run",
    "--rm",
    "--detach",
    "--name",
    containerName,
    "--env",
    "POSTGRES_USER=postgres",
    "--env",
    `POSTGRES_PASSWORD=${password}`,
    "--env",
    `POSTGRES_DB=${dbName}`,
    "--publish",
    `127.0.0.1:${port}:5432`,
    postgresImage,
  ]);
  dockerStarted = true;

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const probe = spawnSync(
      "docker",
      [
        "exec",
        containerName,
        "pg_isready",
        "-U",
        "postgres",
        "-d",
        dbName,
      ],
      { encoding: "utf8" },
    );
    if (probe.status === 0) {
      databaseUrl =
        `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/${dbName}`;
      return {
        mode: "docker",
        port,
        database: dbName,
        postgresVersion: shellText("docker", [
          "exec",
          containerName,
          "postgres",
          "--version",
        ]),
        dockerVersion,
      };
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error("Disposable PostgreSQL did not become ready");
}

function stopDockerPostgres() {
  if (!dockerStarted) return;
  spawnSync("docker", ["rm", "--force", containerName], {
    encoding: "utf8",
    stdio: "ignore",
  });
  dockerStarted = false;
}

function providedPostgresVersion(env) {
  return shellText(
    "node",
    [
      "--input-type=module",
      "--eval",
      [
        'import pg from "pg";',
        "const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });",
        "await client.connect();",
        'const result = await client.query("show server_version");',
        "process.stdout.write(result.rows[0].server_version);",
        "await client.end();",
      ].join(" "),
    ],
    env,
  );
}

function redactDatabaseUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.password) parsed.password = "***";
    if (parsed.username) parsed.username = "***";
    // PostgreSQL connection options may contain password/sslkey secrets.
    // Evidence requires only host and database, never query or fragment data.
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    // Evidence must never echo secrets in a malformed supplied URL.
    return "<invalid PostgreSQL URL>";
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const nodeVersion = process.version;
  let npmVersion = null;
  let gitSha = null;
  let sourceTreeClean = false;
  let sourceTreeCleanAtEnd = false;
  let gitHeadUnchanged = false;
  let provider = null;
  let failure = null;

  try {
    gitSha = shellText("git", ["rev-parse", "HEAD"]);
    // A SHA cannot certify code if tests execute from a modified checkout.
    // Fail before Docker startup or a supplied PostgreSQL version probe, and
    // never print untracked filenames (they may contain sensitive data).
    const dirtyEntries = shellText("git", [
      "status", "--porcelain=v1", "--untracked-files=normal",
    ]);
    if (dirtyEntries) {
      throw new Error(
        "Independent database verification requires a clean tracked and untracked source tree",
      );
    }
    sourceTreeClean = true;
    npmVersion = shellText("npm", ["--version"]);

    if (databaseUrl) {
      // A supplied URL is untrusted. Fail before any PostgreSQL connection,
      // including the nominally read-only server-version probe. Do not hide
      // DATABASE_URL here: it may identify the same application database via
      // different credentials or equivalent loopback host aliases.
      assertSafeDb01TestTarget({
        ...process.env,
        TEST_DATABASE_URL: databaseUrl,
      });
      const env = {
        ...process.env,
        DATABASE_URL: databaseUrl,
        TEST_DATABASE_URL: databaseUrl,
      };
      provider = {
        mode: "provided-url",
        host: new URL(databaseUrl).hostname,
        database: new URL(databaseUrl).pathname.replace(/^\//, ""),
        postgresVersion: providedPostgresVersion(env),
        note:
          "TEST_DATABASE_URL supplied externally; destructive reset runs with TEST_DATABASE_URL only, while later non-destructive gates receive both DB URLs.",
      };
    } else {
      provider = await startDockerPostgres();
    }

    if (!databaseUrl) {
      throw new Error("Disposable PostgreSQL URL was not resolved");
    }

    const env = {
      ...process.env,
      DATABASE_URL: databaseUrl,
      TEST_DATABASE_URL: databaseUrl,
      DB03_ISOLATED_TEST_DATABASE: "1",
      DB06_ISOLATED_TEST_DATABASE: "1",
    };
    // The destructive reset command must never see the application URL as an
    // alias for its target. Preserve the explicit TEST_DATABASE_URL but remove
    // DATABASE_URL for this one subprocess; later migrate/test steps use both.
    const destructiveEnv = { ...env };
    delete destructiveEnv.DATABASE_URL;

    runStep(
      "Migration journal integrity",
      "npm",
      ["run", "db:journal:verify"],
      env,
    );
    runStep(
      "Canonical Drizzle generation",
      "npm",
      ["run", "db:generate"],
      env,
    );
    runStep(
      "Tracked Drizzle schema drift",
      "git",
      // Include both staged/index and unstaged working-tree changes.
      // A plain `git diff` ignores staged generated migrations.
      ["diff", "--exit-code", "HEAD", "--", "drizzle/"],
      env,
    );
    runEmptyOutputStep(
      "Untracked Drizzle schema drift",
      "git",
      ["ls-files", "--others", "--exclude-standard", "drizzle/"],
      env,
    );
    runStep(
      "Disposable database reset + zero-to-head migration + seed",
      "npm",
      ["run", "db:test:prepare"],
      destructiveEnv,
    );
    runStep(
      "Migration idempotence smoke",
      "npm",
      ["run", "db:migrate"],
      env,
    );
    runStep(
      "Read-only PostgreSQL migration/catalog witness",
      "node",
      ["scripts/db002-postgres-catalog-acceptance.mjs"],
      env,
    );
    // DB-078 is a real registered-catalog witness, not a source assertion.
    // Keep the destructive/isolated target environment (no application URL)
    // even though this particular witness performs read-only catalog queries.
    // This makes a mistakenly aliased app/test URL fail closed if introduced.
    runStep(
      "DB-078 registered course-column catalog",
      "node",
      ["--test", "tests/db078-registered-course-column-disposition-pg.test.mjs"],
      { ...destructiveEnv, DB078_DISPOSABLE: "1" },
    );
    // L08 CRM negative suites exercise the registered/seeded disposable DB,
    // use no staged SQL, and roll back all writes.
    runStep(
      "DB09 registered CRM principal and read authorization negatives",
      "node",
      ["tests/db09-collaboration-registered-pg-acceptance.mjs"],
      { ...destructiveEnv, DB09_ISOLATED_TEST_DATABASE: "1" },
    );
    runStep(
      "DB09 registered secure-share lifecycle and disclosure negatives",
      "node",
      ["tests/db09-share-registered-pg-acceptance.mjs"],
      { ...destructiveEnv, DB09_ISOLATED_TEST_DATABASE: "1" },
    );
    runStep(
      "Database parity source/static contracts",
      "npm",
      ["run", "test:db:parity"],
      env,
    );
    runStep(
      "PostgreSQL integration / negative witnesses",
      "npm",
      ["run", "test:db"],
      env,
    );
    // Do not award a pinned-SHA certificate if another worker moved HEAD
    // or edited the source after the initial cleanliness preflight.
    const finalHead = shellText("git", ["rev-parse", "HEAD"]);
    gitHeadUnchanged = finalHead === gitSha;
    sourceTreeCleanAtEnd = !shellText("git", [
      "status", "--porcelain=v1", "--untracked-files=normal",
    ]);
    if (!gitHeadUnchanged || !sourceTreeCleanAtEnd) {
      throw new Error(
        "Independent database verification source checkout changed during the run",
      );
    }
  } catch (error) {
    failure =
      redactVerifierOutput(error instanceof Error ? error.stack ?? error.message : String(error));
    throw error;
  } finally {
    const evidence = {
      schemaVersion: 1,
      purpose: "CI-independent disposable PostgreSQL verification",
      gitSha,
      sourceTreeClean,
      sourceTreeCleanAtEnd,
      gitHeadUnchanged,
      startedAt,
      finishedAt: new Date().toISOString(),
      nodeVersion,
      npmVersion,
      postgresImage:
        provider?.mode === "docker" ? postgresImage : null,
      provider,
      githubActionsUsed: false,
      databaseUrlRedacted: redactDatabaseUrl(databaseUrl),
      steps: results,
      passed:
        sourceTreeClean &&
        sourceTreeCleanAtEnd &&
        gitHeadUnchanged &&
        failure === null &&
        provider !== null &&
        results.length === 12 &&
        results.every(
          (step) =>
            step.exitCode === 0 &&
            (step.expectedEmptyStdout !== true || step.stdoutWasEmpty === true),
        ),
      failure,
    };
    mkdirSync(dirname(evidencePath), { recursive: true });
    writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
    process.stdout.write(`\nVerification evidence: ${evidencePath}\n`);
    stopDockerPostgres();
  }
}

main().catch((error) => {
  process.stderr.write(
    `${redactVerifierOutput(error instanceof Error ? error.stack ?? error.message : String(error))}\n`,
  );
  process.exitCode = 1;
});
