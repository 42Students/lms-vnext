/**
 * In-memory stand-in for the S3 transport used by DB integration tests. No
 * network access: tests mock "@/modules/storage/s3-client" with these
 * functions and "upload" through the grant the service returned.
 */
type StoredObject = {
  bytes: Uint8Array;
  contentType: string;
  metadata: Record<string, string>;
  lastModifiedMs: number;
};

export const objects = new Map<string, StoredObject>();
export const deleted: string[] = [];
let clock = 1_760_000_000_000;

export function resetFakeObjectStore() {
  objects.clear();
  deleted.length = 0;
  clock = 1_760_000_000_000;
}

/** Key inside the grant URL path, with the bucket and any prefix removed. */
export function keyFromUrl(url: string) {
  const path = decodeURIComponent(new URL(url).pathname);
  const index = path.indexOf("/private/");
  return path.slice(index + 1);
}

/** Simulates the browser PUT: stores bytes with exactly the headers the grant required. */
export function putFromGrant(
  grant: { uploadUrl: string; requiredHeaders: Record<string, string> },
  bytes: Uint8Array,
  overrides: { contentType?: string } = {},
) {
  const metadata: Record<string, string> = {};
  for (const [name, value] of Object.entries(grant.requiredHeaders)) {
    if (name.startsWith("x-amz-meta-")) metadata[name.slice("x-amz-meta-".length)] = value;
  }
  clock += 1000;
  objects.set(keyFromUrl(grant.uploadUrl), {
    bytes,
    contentType: overrides.contentType ?? grant.requiredHeaders["content-type"]!,
    metadata,
    lastModifiedMs: clock,
  });
}

export function touchObject(key: string) {
  const object = objects.get(key);
  if (object) {
    clock += 1000;
    object.lastModifiedMs = clock;
  }
}

export async function fakeHead(_config: unknown, key: string) {
  const object = objects.get(key);
  if (!object) return null;
  return {
    etag: "etag",
    lastModifiedMs: object.lastModifiedMs,
    sizeBytes: object.bytes.length,
    contentType: object.contentType,
    metadata: { ...object.metadata },
  };
}

export async function fakeGetObjectStream(
  _config: unknown,
  key: string,
  range?: { start: number; end: number },
) {
  const object = objects.get(key);
  if (!object) return null;
  const data = range ? object.bytes.slice(range.start, range.end + 1) : object.bytes;
  return {
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    }),
    contentType: object.contentType,
    sizeBytes: data.length,
  };
}

export async function fakeDelete(_config: unknown, key: string) {
  deleted.push(key);
  objects.delete(key);
}

export function pdfBytes(extra = "body") {
  return new TextEncoder().encode(`%PDF-1.7\n${extra}\n%%EOF`);
}

export function mp4Bytes(length = 256) {
  const bytes = new Uint8Array(length);
  bytes.set(new TextEncoder().encode("ftypisom"), 4);
  return bytes;
}

export function pngBytes(length = 64) {
  const bytes = new Uint8Array(length);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
}
