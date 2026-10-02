import { afterEach, describe, expect, it } from "vitest";
import { migrationPoolConfigFromEnv } from "../../scripts/db-lib";

const managedKeys = [
  "DATABASE_URL",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "INSTANCE_UNIX_SOCKET",
  "DB_POOL_MAX",
] as const;

const original = Object.fromEntries(
  managedKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of managedKeys) {
    const value = original[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("database migration runtime configuration", () => {
  it("uses DATABASE_URL for local/proxy migrations", () => {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext";
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.INSTANCE_UNIX_SOCKET;
    process.env.DB_POOL_MAX = "8";

    expect(migrationPoolConfigFromEnv()).toEqual({
      connectionString:
        "postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext",
      max: 2,
    });
  });

  it("uses the Cloud SQL Unix socket for Cloud Run migration jobs", () => {
    delete process.env.DATABASE_URL;
    process.env.DB_USER = "lms_vnext_app";
    process.env.DB_PASSWORD = "secret-value";
    process.env.DB_NAME = "lms_vnext";
    process.env.INSTANCE_UNIX_SOCKET =
      "/cloudsql/example-project:asia-south1:lms-vnext-dev";
    process.env.DB_POOL_MAX = "5";

    expect(migrationPoolConfigFromEnv()).toEqual({
      host: "/cloudsql/example-project:asia-south1:lms-vnext-dev",
      user: "lms_vnext_app",
      password: "secret-value",
      database: "lms_vnext",
      max: 2,
    });
  });
});
