import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!parsed.success) {
    throw new Error(
      "Invalid server environment configuration: " +
        z.prettifyError(parsed.error),
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
