import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";

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
      `${command} ${args.join(" ")} failed (${result.status})\n${result.stderr || result.stdout}`,
    );
  }
  return (result.stdout || result.stderr || "").trim();
}

function outputTail(value, maxLines = 80) {
  const lines = String(value ?? "").split(/\r?\n/);
  return lines.slice(-maxLines).join("\n");
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
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  const combined = `${stdout}\n${stderr}`;
  const record = {
    name,
    command: [command, ...args],
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal ?? null,
    outputSha256: createHash("sha256").update(combined).digest("hex"),
    outputTail: outputTail(combined),
  };
  results.push(record);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${name} failed with exit code ${result.status}`);
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
  shellText("docker", ["version", "--format", "{{.Server.Version}}"]);
  const port = await findFreePort();
  const password = `verify-${process.pid}`;
  const dbName = `lms_vnext_verify_${process.pid}`;

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
        dockerVersion: shellText("docker", [
          "version",
          "--format",
          "{{.Server.Version}}",
        ]),
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

async function main() {
  const gitSha = shellText("git", ["rev-parse", "HEAD"]);
  const nodeVersion = process.version;
  const npmVersion = shellText("npm", ["--version"]);

  let provider;
  if (databaseUrl) {
    provider = {
      mode: "provided-url",
      host: new URL(databaseUrl).hostname,
      database: new URL(databaseUrl).pathname.replace(/^\//, ""),
      note:
        "TEST_DATABASE_URL supplied externally; scripts/db-test-prepare.ts still enforces reset safety.",
    };
  } else {
    provider = await startDockerPostgres();
  }

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl,
    DB03_ISOLATED_TEST_DATABASE: "1",
  };

  const startedAt = new Date().toISOString();
  let failure = null;
  try {
    runStep(
      "Migration journal integrity",
      "npm",
      ["run", "db:journal:verify"],
      env,
    );
    runStep(
      "Disposable database reset + zero-to-head migration + seed",
      "npm",
      ["run", "db:test:prepare"],
      env,
    );
    runStep(
      "Migration idempotence smoke",
      "npm",
      ["run", "db:migrate"],
      env,
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
  } catch (error) {
    failure =
      error instanceof Error ? error.stack ?? error.message : String(error);
    throw error;
  } finally {
    const evidence = {
      schemaVersion: 1,
      purpose: "CI-independent disposable PostgreSQL verification",
      gitSha,
      startedAt,
      finishedAt: new Date().toISOString(),
      nodeVersion,
      npmVersion,
      postgresImage:
        provider.mode === "docker" ? postgresImage : null,
      provider,
      githubActionsUsed: false,
      databaseUrlRedacted: databaseUrl
        ? (() => {
            const parsed = new URL(databaseUrl);
            if (parsed.password) parsed.password = "***";
            if (parsed.username) parsed.username = "***";
            return parsed.toString();
          })()
        : null,
      steps: results,
      passed: failure === null && results.every((step) => step.exitCode === 0),
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
    `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
