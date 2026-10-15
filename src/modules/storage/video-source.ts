import "server-only";

import { createHash, createSign } from "node:crypto";
import { getPrivateR2Config } from "./r2-config";
import { awsEncode, presignUrl } from "./s3-client";
import { StorageFileError } from "./file-errors";

/**
 * Where a video object is read from. R2 (the private dev/production bucket) is
 * the default and the only source wired to lesson_video_assets today. The GCS
 * adapter exists so videos that still live in a legacy Google Cloud Storage
 * bucket can be played later without changing the playback API: it signs a
 * V4 URL with node:crypto only and is disabled unless every GCS_VIDEO_*
 * variable is present. Nothing here stores or logs a URL.
 */
export type VideoSourceName = "R2" | "GCS";

export type PlaybackUrl = { url: string; expiresAt: Date };

export interface VideoSource {
  readonly name: VideoSourceName;
  createPlaybackUrl(input: { objectKey: string; ttlSeconds: number; now?: Date }): PlaybackUrl;
}

const MAX_TTL_SECONDS = 7 * 24 * 60 * 60;

function clampTtl(ttlSeconds: number) {
  if (!Number.isFinite(ttlSeconds)) throw new StorageFileError("STORAGE_SIZE_INVALID");
  return Math.min(Math.max(Math.trunc(ttlSeconds), 1), MAX_TTL_SECONDS);
}

export class R2VideoSource implements VideoSource {
  readonly name = "R2" as const;

  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  createPlaybackUrl(input: { objectKey: string; ttlSeconds: number; now?: Date }): PlaybackUrl {
    const ttl = clampTtl(input.ttlSeconds);
    const now = input.now ?? new Date();
    const url = presignUrl(getPrivateR2Config(this.env), {
      method: "GET",
      key: input.objectKey,
      expiresSeconds: ttl,
      now,
    });
    return { url, expiresAt: new Date(now.getTime() + ttl * 1000) };
  }
}

export type GcsVideoConfig = {
  bucket: string;
  clientEmail: string;
  privateKeyPem: string;
};

/** Returns null (adapter disabled) unless the opt-in flag and all three values are present. */
export function readGcsVideoConfig(env: NodeJS.ProcessEnv = process.env): GcsVideoConfig | null {
  if (env.GCS_VIDEO_ENABLED !== "true") return null;
  const bucket = env.GCS_VIDEO_BUCKET?.trim();
  const clientEmail = env.GCS_VIDEO_CLIENT_EMAIL?.trim();
  const privateKeyPem = env.GCS_VIDEO_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!bucket || !clientEmail || !privateKeyPem) return null;
  return { bucket, clientEmail, privateKeyPem };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function gcsTimestamps(now: Date) {
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return { date, datetime: `${date}T${time}Z` };
}

function encodeObjectPath(bucket: string, objectKey: string) {
  return `/${bucket}/${objectKey.split("/").map(awsEncode).join("/")}`;
}

/**
 * Google Cloud Storage V4 signed URL (GOOG4-RSA-SHA256), signed with the
 * service account private key. Signs only the host header, so any HTTP Range
 * request works on the resulting URL.
 */
export function signGcsV4ReadUrl(
  config: GcsVideoConfig,
  input: { objectKey: string; ttlSeconds: number; now?: Date },
): PlaybackUrl {
  if (!input.objectKey || input.objectKey.includes("..") || input.objectKey.startsWith("/")) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  const ttl = clampTtl(input.ttlSeconds);
  const now = input.now ?? new Date();
  const { date, datetime } = gcsTimestamps(now);
  const scope = `${date}/auto/storage/goog4_request`;
  const query: Record<string, string> = {
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": `${config.clientEmail}/${scope}`,
    "X-Goog-Date": datetime,
    "X-Goog-Expires": String(ttl),
    "X-Goog-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${awsEncode(name)}=${awsEncode(query[name]!)}`)
    .join("&");
  const path = encodeObjectPath(config.bucket, input.objectKey);
  const canonicalRequest = ["GET", path, canonicalQuery, "host:storage.googleapis.com\n", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = [
    "GOOG4-RSA-SHA256",
    datetime,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signature = createSign("RSA-SHA256").update(stringToSign).sign(config.privateKeyPem, "hex");
  return {
    url: `https://storage.googleapis.com${path}?${canonicalQuery}&X-Goog-Signature=${signature}`,
    expiresAt: new Date(now.getTime() + ttl * 1000),
  };
}

export class GcsVideoSource implements VideoSource {
  readonly name = "GCS" as const;

  constructor(private readonly config: GcsVideoConfig) {}

  createPlaybackUrl(input: { objectKey: string; ttlSeconds: number; now?: Date }): PlaybackUrl {
    return signGcsV4ReadUrl(this.config, input);
  }
}

/** R2 unless GCS is explicitly requested and fully configured; an unconfigured GCS request fails closed. */
export function resolveVideoSource(
  name: VideoSourceName = "R2",
  env: NodeJS.ProcessEnv = process.env,
): VideoSource {
  if (name === "R2") return new R2VideoSource(env);
  const config = readGcsVideoConfig(env);
  if (!config) throw new StorageFileError("STORAGE_NOT_CONFIGURED");
  return new GcsVideoSource(config);
}
