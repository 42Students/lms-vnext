import "server-only";

import type { S3Config } from "./s3-client";
import { PrivateObjectStorageError } from "./storage-errors";

/**
 * Private object storage lives in its own R2 bucket. The legacy LMS bucket
 * (R2_BUCKET_NAME) is served publicly through R2_PUBLIC_URL, so it must never
 * hold vNext private files: the two names are required to differ.
 */
export function getPrivateR2Config(
  env: NodeJS.ProcessEnv = process.env,
): S3Config {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY?.trim();
  const secretAccessKey = env.R2_SECRET_KEY?.trim();
  const bucket = env.R2_PRIVATE_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_NOT_CONFIGURED");
  }
  if (bucket === env.R2_BUCKET_NAME?.trim()) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE");
  }
  return {
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}
