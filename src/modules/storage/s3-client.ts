import { createHash, createHmac } from "node:crypto";

/**
 * Minimal S3-compatible client (Cloudflare R2) using AWS Signature V4 with
 * node:crypto only. Covers exactly what private storage needs: presigned
 * PUT/GET URLs and server-side HEAD/GET/DELETE. No SDK dependency.
 */
export type S3Config = {
  endpoint: string; // https://<account>.r2.cloudflarestorage.com
  /** Path-style bucket. Leave empty when the endpoint host already names the bucket. */
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string; // R2 uses "auto"
  /**
   * Optional key prefix (for example "vnext-dev/") applied to every object key
   * at the transport boundary. Callers keep using logical, unprefixed keys.
   */
  keyPrefix?: string;
};

const SERVICE = "s3";

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

/** RFC 3986 encoding as required by SigV4 (encodeURIComponent plus !'()*). */
export function awsEncode(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodePath(path: string) {
  return path.split("/").map(awsEncode).join("/");
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

export function signingKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service = SERVICE,
) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

type SignInput = {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  key: string;
  now?: Date;
  expiresSeconds?: number;
  /** Extra headers that must be sent by the caller and are bound to the signature. */
  headers?: Record<string, string>;
  query?: Record<string, string>;
};

function prefixedKey(config: S3Config, key: string) {
  // A resource grant may never substitute another bucket, URL or parent path.
  if (!key || key.length > 1024 || key.startsWith("/") || key.includes("\\") ||
      key.split("/").some(part => part === "." || part === "..") ||
      /[\x00-\x1f\x7f]/.test(key)) throw new Error("S3_OBJECT_KEY_INVALID");
  return `${config.keyPrefix ?? ""}${key}`;
}

function objectLocation(config: S3Config, key: string) {
  const url = new URL(config.endpoint);
  const fullKey = prefixedKey(config, key);
  return {
    host: url.host,
    origin: url.origin,
    path: config.bucket ? `/${config.bucket}/${fullKey}` : `/${fullKey}`,
  };
}

/** Builds a presigned URL (query-string authentication). */
export function presignUrl(config: S3Config, input: SignInput) {
  if (input.expiresSeconds !== undefined &&
      (!Number.isSafeInteger(input.expiresSeconds) || input.expiresSeconds < 1 ||
       input.expiresSeconds > 604800)) throw new Error("S3_PRESIGN_EXPIRES_INVALID");
  const region = config.region ?? "auto";
  const now = input.now ?? new Date();
  const stamp = amzDate(now);
  const dateStamp = stamp.slice(0, 8);
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const { host, origin, path } = objectLocation(config, input.key);

  const headers: Record<string, string> = {
    host,
    ...Object.fromEntries(
      Object.entries(input.headers ?? {}).map(([name, value]) => [
        name.toLowerCase(),
        value.trim(),
      ]),
    ),
  };
  const headerNames = Object.keys(headers).sort();
  const signedHeaders = headerNames.join(";");

  const query: Record<string, string> = {
    ...input.query,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": stamp,
    "X-Amz-Expires": String(input.expiresSeconds ?? 300),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${awsEncode(name)}=${awsEncode(query[name]!)}`)
    .join("&");

  const canonicalRequest = [
    input.method,
    encodePath(path),
    canonicalQuery,
    headerNames.map((name) => `${name}:${headers[name]}\n`).join(""),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    stamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(config.secretAccessKey, dateStamp, region),
  )
    .update(stringToSign)
    .digest("hex");

  return `${origin}${encodePath(path)}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export type S3ObjectHead = {
  etag: string;
  /** Last-Modified as epoch milliseconds; changes on every overwrite or metadata replace. */
  lastModifiedMs: number;
  sizeBytes: number;
  contentType: string;
  metadata: Record<string, string>;
};

/** Signed server-side request (short-lived presign, then plain fetch). */
async function send(
  config: S3Config,
  method: "GET" | "HEAD" | "DELETE",
  key: string,
) {
  const url = presignUrl(config, { method, key, expiresSeconds: 60 });
  return fetch(url, { method, cache: "no-store" });
}

export async function headObject(
  config: S3Config,
  key: string,
): Promise<S3ObjectHead | null> {
  const response = await send(config, "HEAD", key);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`S3_HEAD_${response.status}`);
  const metadata: Record<string, string> = {};
  response.headers.forEach((value, name) => {
    if (name.startsWith("x-amz-meta-")) {
      metadata[name.slice("x-amz-meta-".length)] = value;
    }
  });
  return {
    etag: (response.headers.get("etag") ?? "").replaceAll('"', ""),
    lastModifiedMs: Date.parse(response.headers.get("last-modified") ?? "") || 0,
    sizeBytes: Number(response.headers.get("content-length") ?? 0),
    contentType: response.headers.get("content-type") ?? "",
    metadata,
  };
}

export async function getObjectStream(
  config: S3Config,
  key: string,
  range?: { start: number; end: number },
) {
  if (range && (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) ||
      range.start < 0 || range.end < range.start)) throw new Error("S3_RANGE_INVALID");
  const url = presignUrl(config, { method: "GET", key, expiresSeconds: 60 });
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: range ? { range: `bytes=${range.start}-${range.end}` } : undefined,
  });
  if (response.status === 404) return null;
  if (!response.ok || !response.body) {
    throw new Error(`S3_GET_${response.status}`);
  }
  return {
    body: response.body,
    contentType: response.headers.get("content-type") ?? "",
    sizeBytes: Number(response.headers.get("content-length") ?? 0),
  };
}

/** Legacy doesObjectExist parity without swallowing credential/network errors.
 * A 404 is false; all other failed HEAD responses remain actionable errors. */
export async function objectExists(config:S3Config,key:string):Promise<boolean>{
  return (await headObject(config,key))!==null;
}

export async function deleteObject(config: S3Config, key: string) {
  const response = await send(config, "DELETE", key);
  if (!response.ok && response.status !== 404) {
    throw new Error(`S3_DELETE_${response.status}`);
  }
}

/**
 * Header-authenticated request (Authorization header). Needed for bucket-level
 * operations and CopyObject, which R2 does not accept as presigned URLs.
 * `path` is the full request path including the bucket, for example "/bucket".
 */
export async function signedFetch(
  config: S3Config,
  input: {
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    path: string;
    headers?: Record<string, string>;
    now?: Date;
  },
) {
  const region = config.region ?? "auto";
  const now = input.now ?? new Date();
  const stamp = amzDate(now);
  const dateStamp = stamp.slice(0, 8);
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const url = new URL(config.endpoint);
  const payloadHash = sha256Hex("");

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": stamp,
    ...Object.fromEntries(
      Object.entries(input.headers ?? {}).map(([name, value]) => [
        name.toLowerCase(),
        value.trim(),
      ]),
    ),
  };
  const headerNames = Object.keys(headers).sort();
  const signedHeaders = headerNames.join(";");
  const canonicalRequest = [
    input.method,
    encodePath(input.path),
    "",
    headerNames.map((name) => `${name}:${headers[name]}\n`).join(""),
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    stamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(config.secretAccessKey, dateStamp, region),
  )
    .update(stringToSign)
    .digest("hex");

  const { host: _host, ...sendHeaders } = headers;
  void _host;
  return fetch(`${url.origin}${encodePath(input.path)}`, {
    method: input.method,
    cache: "no-store",
    headers: {
      ...sendHeaders,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
}

/** Server-side copy onto itself to replace metadata (R2 has no metadata PATCH). */
export async function replaceObjectMetadata(
  config: S3Config,
  key: string,
  metadata: Record<string, string>,
  contentType: string,
) {
  const response = await signedFetch(config, {
    method: "PUT",
    path: `/${config.bucket}/${prefixedKey(config, key)}`,
    headers: {
      "x-amz-copy-source": `/${config.bucket}/${encodePath(prefixedKey(config, key))}`,
      "x-amz-metadata-directive": "REPLACE",
      "content-type": contentType,
      ...Object.fromEntries(
        Object.entries(metadata).map(([name, value]) => [
          `x-amz-meta-${name}`,
          value,
        ]),
      ),
    },
  });
  if (!response.ok) throw new Error(`S3_COPY_${response.status}`);
}
