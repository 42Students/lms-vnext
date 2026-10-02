import { describe, expect, it } from "vitest";
import {
  getDatabaseConnectionConfig,
  parseServerEnv,
} from "@/lib/env";

describe("server environment", () => {
  it("supports local/proxy DATABASE_URL mode with blank optional GCP fields", () => {
    const env = parseServerEnv({
      DATABASE_URL:
        "postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext",
      DB_POOL_MAX: "7",
      DB_USER: "",
      DB_PASSWORD: "   ",
      DB_NAME: "",
      INSTANCE_UNIX_SOCKET: "",
      GOOGLE_CLOUD_PROJECT: "",
      GCP_REGION: "",
      GCS_BUCKET: "",
    });

    expect(getDatabaseConnectionConfig(env)).toEqual({
      mode: "url",
      connectionString:
        "postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext",
      max: 7,
    });
  });

  it("supports Cloud Run Cloud SQL Unix-socket mode", () => {
    const env = parseServerEnv({
      DB_USER: "lms_vnext_app",
      DB_PASSWORD: "secret-value",
      DB_NAME: "lms_vnext",
      INSTANCE_UNIX_SOCKET:
        "/cloudsql/example-project:asia-south1:lms-vnext-dev",
      GOOGLE_CLOUD_PROJECT: "example-project",
      GCP_REGION: "asia-south1",
    });

    expect(getDatabaseConnectionConfig(env)).toEqual({
      mode: "cloud-sql-unix",
      host: "/cloudsql/example-project:asia-south1:lms-vnext-dev",
      user: "lms_vnext_app",
      password: "secret-value",
      database: "lms_vnext",
      max: 5,
    });
  });

  it("rejects mixed URL and Unix-socket strategies", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL:
          "postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext",
        DB_USER: "lms_vnext_app",
        DB_PASSWORD: "secret-value",
        DB_NAME: "lms_vnext",
        INSTANCE_UNIX_SOCKET:
          "/cloudsql/example-project:asia-south1:lms-vnext-dev",
      }),
    ).toThrow(/either DATABASE_URL or the Cloud SQL Unix-socket fields/i);
  });

  it("rejects a partial Cloud SQL configuration", () => {
    expect(() =>
      parseServerEnv({
        DB_USER: "lms_vnext_app",
        DB_NAME: "lms_vnext",
      }),
    ).toThrow(/requires DATABASE_URL or DB_USER/i);
  });
});
