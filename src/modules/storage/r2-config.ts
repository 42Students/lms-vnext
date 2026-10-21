import "server-only";

import type { S3Config } from "./s3-client";
import { PrivateObjectStorageError } from "./storage-errors";

/**
 * Private object storage normally lives in its own R2 bucket. The legacy LMS
 * bucket (R2_BUCKET_NAME) is served publicly through R2_PUBLIC_URL, so the two
 * names are required to differ.
 *
 * Temporary exception: in development only (APP_ENV=development), the legacy
 * bucket may be shared when R2_PRIVATE_PREFIX is a non-empty prefix ending in
 * "/" (for example "vnext-dev/"). Every key is then written under that prefix
 * and objects are only ever served via short-lived signed URLs, never through
 * R2_PUBLIC_URL. Production stays strict.
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
  const keyPrefix = env.R2_PRIVATE_PREFIX?.trim() ?? "";
  if (keyPrefix && (!keyPrefix.endsWith("/") || keyPrefix.startsWith("/") ||
      keyPrefix.includes("..") || keyPrefix.includes("\\") ||
      keyPrefix.includes("//") || /[\\x00-\\x1f]/.test(keyPrefix))) {
    throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE");
  }
  if (bucket === env.R2_BUCKET_NAME?.trim()) {
    const sharedBucketAllowed =
      env.APP_ENV === "development" && keyPrefix.length > 0 &&
      !env.R2_PUBLIC_URL?.trim();
    if (!sharedBucketAllowed) {
      throw new PrivateObjectStorageError("PRIVATE_STORAGE_BUCKET_UNSAFE");
    }
  }
  return {
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket,
    accessKeyId,
    secretAccessKey,
    ...(keyPrefix ? { keyPrefix } : {}),
  };
}

/** A public legacy base URL must never be returned as a private read grant.
 * All vNext callers authorize a resource then sign its private object key.
 */
export const PRIVATE_R2_SETUP_MESSAGE =
 "Private document storage is not set up yet. Please try again later.";
