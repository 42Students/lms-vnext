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

/** Signed storage requests must not follow a provider/proxy redirect. */
const STORAGE_FETCH_REDIRECT_POLICY = "error" as const;

function checkedEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || !url.hostname || url.username ||
      url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("S3_ENDPOINT_INVALID");
  }
  return url;
}

function signedExtraHeaders(headers: Record<string,string> | undefined,
  reserved: readonly string[]) {
  const output: Record<string,string> = {};
  const entries = Object.entries(headers ?? {});
  if (entries.length > 32) throw new Error("S3_SIGNED_HEADERS_INVALID");
  for (const [rawName, value] of entries) {
    const name = rawName.toLowerCase();
    if (!/^[a-z0-9-]+$/.test(name) || reserved.includes(name) ||
        typeof value !== "string" || value.length > 4096 ||
        /[\x00-\x1f\x7f]/.test(value) || Object.hasOwn(output,name))
      throw new Error("S3_SIGNED_HEADERS_INVALID");
    output[name] = value.trim();
  }
  return output;
}

function strictContentLength(header: string | null) {
  if (header === null || !/^(0|[1-9][0-9]*)$/.test(header))
    throw new Error("S3_CONTENT_LENGTH_INVALID");
  const value = Number(header);
  if (!Number.isSafeInteger(value)) throw new Error("S3_CONTENT_LENGTH_INVALID");
  return value;
}

/** Bounds the bytes actually consumed, not only the provider's Content-Length.
 * A malicious, faulty or misconfigured proxy must never turn an otherwise
 * authenticated private object stream into an unlimited response. */
function boundedObjectBody(body: ReadableStream<Uint8Array>, expectedBytes: number) {
  const reader = body.getReader();
  let received = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const {done,value} = await reader.read();
        if (done) {
          if (received !== expectedBytes) {
            controller.error(new Error("S3_BODY_LENGTH_MISMATCH"));
          } else {
            controller.close();
          }
          reader.releaseLock();
          return;
        }
        received += value.byteLength;
        if (!Number.isSafeInteger(received) || received > expectedBytes) {
          await reader.cancel().catch(() => {});
          controller.error(new Error("S3_BODY_LENGTH_MISMATCH"));
          reader.releaseLock();
          return;
        }
        controller.enqueue(value);
      } catch {
        controller.error(new Error("S3_OBJECT_STREAM_FAILED"));
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
      reader.releaseLock();
    },
  });
}

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

function checkedBucket(bucket: string) {
  // The empty bucket is intentional for virtual-hosted AWS SigV4 vectors.
  if (bucket && (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
      bucket.includes(".."))) throw new Error("S3_BUCKET_INVALID");
  return bucket;
}

function objectLocation(config: S3Config, key: string) {
  const url = checkedEndpoint(config.endpoint);
  const bucket = checkedBucket(config.bucket);
  const fullKey = prefixedKey(config, key);
  return {
    host: url.host,
    origin: url.origin,
    path: bucket ? `/${bucket}/${fullKey}` : `/${fullKey}`,
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
    ...signedExtraHeaders(input.headers, ["host", "authorization"]),
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
  return fetch(url, { method, cache: "no-store",
    redirect: STORAGE_FETCH_REDIRECT_POLICY });
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
    sizeBytes: strictContentLength(response.headers.get("content-length")),
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
    redirect: STORAGE_FETCH_REDIRECT_POLICY,
    ...(range ? { headers: { range: `bytes=${range.start}-${range.end}` } } : {}),
  });
  if (response.status === 404) return null;
  if (!response.ok || !response.body) {
    throw new Error(`S3_GET_${response.status}`);
  }
  // Refuse a full-object 200 response when a private file verifier asked
  // for a bounded range. This is not a best-effort range hint.
  if (range && response.status !== 206) {
    await response.body.cancel().catch(() => {});
    throw new Error("S3_RANGE_RESPONSE_INVALID");
  }
  const lengthHeader = response.headers.get("content-length");
  let receivedLength: number;
  try {
    receivedLength = strictContentLength(lengthHeader);
  } catch {
    await response.body.cancel().catch(() => {});
    throw new Error("S3_CONTENT_LENGTH_INVALID");
  }
  if (range) {
    const match = /^bytes ([0-9]+)-([0-9]+)\/([0-9]+)$/.exec(
      response.headers.get("content-range") ?? "",
    );
    const first = match ? Number(match[1]) : NaN;
    const last = match ? Number(match[2]) : NaN;
    const total = match ? Number(match[3]) : NaN;
    if (!match || ![first,last,total].every(Number.isSafeInteger) ||
        first !== range.start || last < first || last > range.end ||
        total <= last || receivedLength !== last - first + 1) {
      await response.body.cancel().catch(() => {});
      throw new Error("S3_RANGE_RESPONSE_INVALID");
    }
  }
  return {
    body: boundedObjectBody(response.body, receivedLength),
    contentType: response.headers.get("content-type") ?? "",
    sizeBytes: receivedLength,
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
  const url = checkedEndpoint(config.endpoint);
  if (!input.path.startsWith("/") || input.path.length > 2048 ||
      input.path.includes("\\") || /[\x00-\x1f\x7f?#]/.test(input.path) ||
      input.path.split("/").some(part => part === "." || part === ".."))
    throw new Error("S3_SIGNED_PATH_INVALID");
  const payloadHash = sha256Hex("");

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": stamp,
    ...signedExtraHeaders(input.headers,
      ["host", "x-amz-content-sha256", "x-amz-date", "authorization"]),
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
    redirect: STORAGE_FETCH_REDIRECT_POLICY,
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
    path: `/${checkedBucket(config.bucket)}/${prefixedKey(config, key)}`,
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
