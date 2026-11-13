import { z } from "zod";

import { env as appEnv } from "@/config/env";
function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === ""
    ? undefined
    : value;
}

const optionalNonEmpty = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).optional(),
);

const optionalUnixSocket = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().startsWith("/cloudsql/").optional(),
);

const serverEnvSchema = z
  .object({
    DATABASE_URL: optionalNonEmpty,
    DB_USER: optionalNonEmpty,
    DB_PASSWORD: optionalNonEmpty,
    DB_NAME: optionalNonEmpty,
    INSTANCE_UNIX_SOCKET: optionalUnixSocket,
    DB_POOL_MAX: z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5),
    GOOGLE_CLOUD_PROJECT: optionalNonEmpty,
    GCP_REGION: optionalNonEmpty,
  })
  .superRefine((value, context) => {
    const socketFields = [
      value.DB_USER,
      value.DB_PASSWORD,
      value.DB_NAME,
      value.INSTANCE_UNIX_SOCKET,
    ];
    const hasAnySocketField = socketFields.some(Boolean);
    const hasAllSocketFields = socketFields.every(Boolean);

    if (value.DATABASE_URL && hasAnySocketField) {
      context.addIssue({
        code: "custom",
        message:
          "Use either DATABASE_URL or the Cloud SQL Unix-socket fields, not both",
        path: ["DATABASE_URL"],
      });
      return;
    }

    if (!value.DATABASE_URL && !hasAllSocketFields) {
      context.addIssue({
        code: "custom",
        message:
          "Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET",
        path: ["DATABASE_URL"],
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type DatabaseConnectionConfig =
  | {
      mode: "url";
      connectionString: string;
      max: number;
    }
  | {
      mode: "cloud-sql-unix";
      host: string;
      user: string;
      password: string;
      database: string;
      max: number;
    };

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      "Invalid server environment configuration: " +
        z.prettifyError(parsed.error),
    );
  }

  return parsed.data;
}

export function getDatabaseConnectionConfig(
  env: ServerEnv,
): DatabaseConnectionConfig {
  if (env.DATABASE_URL) {
    return {
      mode: "url",
      connectionString: env.DATABASE_URL,
      max: env.DB_POOL_MAX,
    };
  }

  if (
    !env.DB_USER ||
    !env.DB_PASSWORD ||
    !env.DB_NAME ||
    !env.INSTANCE_UNIX_SOCKET
  ) {
    throw new Error("Incomplete Cloud SQL Unix-socket configuration");
  }

  return {
    mode: "cloud-sql-unix",
    host: env.INSTANCE_UNIX_SOCKET,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: env.DB_POOL_MAX,
  };
}

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = parseServerEnv({
    DATABASE_URL: appEnv.DATABASE_URL,
    DB_USER: appEnv.DB_USER,
    DB_PASSWORD: appEnv.DB_PASSWORD,
    DB_NAME: appEnv.DB_NAME,
    INSTANCE_UNIX_SOCKET: appEnv.INSTANCE_UNIX_SOCKET,
    DB_POOL_MAX: appEnv.DB_POOL_MAX,
    GOOGLE_CLOUD_PROJECT: appEnv.GOOGLE_CLOUD_PROJECT,
    GCP_REGION: appEnv.GCP_REGION,
  });

  return cachedEnv;
}
