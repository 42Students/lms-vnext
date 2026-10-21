import {
  DEFAULT_CHUNK_MS,
  exportRangeChunked,
  isRateLimitError,
  isRetryableChunkError,
  parseNdjsonExport,
  splitRange,
} from "../trackerLogsExport";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ndjson(entries, meta = {}) {
  const lines = entries.map((e) => JSON.stringify(e));
  lines.push(JSON.stringify({ _meta: true, environment: "PRODUCTION", count: entries.length, truncated: false, ...meta }));
  return lines.join("\n") + "\n";
}

const blobOf = (text) => ({ blob: { text: async () => text } });

describe("defaults", () => {
  test("pieces stay well under what the 30s load balancer allows", () => {
    expect(DEFAULT_CHUNK_MS).toBeLessThanOrEqual(6 * HOUR);
  });
});

describe("splitRange", () => {
  test("covers the range with newest window first and no gaps", () => {
    const since = Date.UTC(2026, 8, 21);
    const until = since + 3 * DAY + 5 * HOUR;
    const windows = splitRange(since, until, DAY);
    expect(windows).toHaveLength(4);
    expect(windows[0][1]).toBe(until);
    expect(windows[windows.length - 1][0]).toBe(since);
    windows.slice(1).forEach((w, i) => expect(w[1]).toBe(windows[i][0]));
  });

  test("a range shorter than the chunk is one window", () => {
    expect(splitRange(0, 5 * HOUR, DAY)).toEqual([[0, 5 * HOUR]]);
  });
});

describe("parseNdjsonExport", () => {
  test("separates entries from the trailing meta line", () => {
    const { entries, meta } = parseNdjsonExport(ndjson([{ insertId: "a" }, { insertId: "b" }]));
    expect(entries).toHaveLength(2);
    expect(meta.count).toBe(2);
  });

  test("a body with no meta line keeps every line as an entry", () => {
    const { entries, meta } = parseNdjsonExport('{"insertId":"a"}\n');
    expect(entries).toHaveLength(1);
    expect(meta).toBeNull();
  });
});

describe("isRetryableChunkError", () => {
  test("gateway timeouts and network failures retry; app errors do not", () => {
    expect(isRetryableChunkError({ response: { status: 502 } })).toBe(true);
    expect(isRetryableChunkError({ status: 504 })).toBe(true);
    expect(isRetryableChunkError({ code: "ERR_NETWORK" })).toBe(true);
    expect(isRetryableChunkError({ response: { status: 403 } })).toBe(false);
    expect(isRetryableChunkError(new Error("Range is too wide"))).toBe(false);
  });
});

describe("exportRangeChunked", () => {
  const since = new Date(Date.UTC(2026, 8, 21)).toISOString();
  const until = new Date(Date.UTC(2026, 8, 24)).toISOString();

  test("merges chunks, dedupes boundary entries and reports one combined meta", async () => {
    const fetchChunk = jest
      .fn()
      .mockResolvedValueOnce(blobOf(ndjson([{ insertId: "c" }, { insertId: "b" }])))
      .mockResolvedValueOnce(blobOf(ndjson([{ insertId: "b" }, { insertId: "a" }], { truncated: true })))
      .mockResolvedValueOnce(blobOf(ndjson([])));
    const { text, meta } = await exportRangeChunked({ fetchChunk, since, until, chunkMs: DAY });
    expect(fetchChunk).toHaveBeenCalledTimes(3);
    expect(meta.count).toBe(3);
    expect(meta.truncated).toBe(true);
    expect(meta.environment).toBe("PRODUCTION");
    const { entries } = parseNdjsonExport(text);
    expect(entries.map((l) => JSON.parse(l).insertId)).toEqual(["c", "b", "a"]);
  });

  test("halves a chunk that times out and still returns everything", async () => {
    const timeout = Object.assign(new Error("timeout"), { response: { status: 502 } });
    const fetchChunk = jest
      .fn()
      .mockRejectedValueOnce(timeout)
      .mockResolvedValueOnce(blobOf(ndjson([{ insertId: "new" }])))
      .mockResolvedValueOnce(blobOf(ndjson([{ insertId: "old" }])));
    const day = new Date(Date.UTC(2026, 8, 21)).toISOString();
    const nextDay = new Date(Date.UTC(2026, 8, 22)).toISOString();
    const { meta, text } = await exportRangeChunked({ fetchChunk, since: day, until: nextDay, chunkMs: DAY });
    expect(fetchChunk).toHaveBeenCalledTimes(3);
    const halves = fetchChunk.mock.calls.slice(1);
    expect(new Date(halves[0][0]).getTime()).toBe(new Date(halves[1][1]).getTime());
    expect(meta.count).toBe(2);
    expect(parseNdjsonExport(text).entries.map((l) => JSON.parse(l).insertId)).toEqual(["new", "old"]);
  });

  test("gives up once a chunk is already at the minimum size", async () => {
    const timeout = Object.assign(new Error("timeout"), { response: { status: 502 } });
    const fetchChunk = jest.fn().mockRejectedValue(timeout);
    const a = new Date(Date.UTC(2026, 8, 21)).toISOString();
    const b = new Date(Date.UTC(2026, 8, 21, 1)).toISOString();
    await expect(exportRangeChunked({ fetchChunk, since: a, until: b })).rejects.toThrow("timeout");
    expect(fetchChunk).toHaveBeenCalledTimes(1);
  });

  test("a non-retryable error is thrown immediately", async () => {
    const fetchChunk = jest.fn().mockRejectedValue(Object.assign(new Error("nope"), { response: { status: 403 } }));
    await expect(exportRangeChunked({ fetchChunk, since, until })).rejects.toThrow("nope");
    expect(fetchChunk).toHaveBeenCalledTimes(1);
  });

  test("a rate-limited chunk waits with a growing pause and is retried, not failed", async () => {
    const limited = Object.assign(new Error("429"), { response: { status: 429 } });
    const fetchChunk = jest.fn()
      .mockRejectedValueOnce(limited)
      .mockRejectedValueOnce(limited)
      .mockResolvedValue(blobOf(ndjson([{ insertId: "a" }])));
    const sleep = jest.fn().mockResolvedValue();
    const day = new Date(Date.UTC(2026, 8, 21)).toISOString();
    const nextDay = new Date(Date.UTC(2026, 8, 22)).toISOString();

    const { meta } = await exportRangeChunked({ fetchChunk, since: day, until: nextDay, chunkMs: DAY, sleep });

    expect(meta.count).toBe(1);
    expect(fetchChunk).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining([3000, 6000]));
  });

  test("persistent rate limiting ends with a plain message telling the user to wait", async () => {
    const limited = Object.assign(new Error("429"), { response: { status: 429 } });
    const fetchChunk = jest.fn().mockRejectedValue(limited);
    const sleep = jest.fn().mockResolvedValue();
    const a = new Date(Date.UTC(2026, 8, 21)).toISOString();
    const b = new Date(Date.UTC(2026, 8, 22)).toISOString();

    await expect(exportRangeChunked({ fetchChunk, since: a, until: b, chunkMs: DAY, sleep })).rejects.toThrow(/rate limiting reads/);
    expect(fetchChunk).toHaveBeenCalledTimes(4);
  });

  test("a client timeout is retried with a smaller slice, and at one hour it says so plainly", async () => {
    const timeout = Object.assign(new Error("timeout of 30000ms exceeded"), { code: "ECONNABORTED" });
    const sleep = jest.fn().mockResolvedValue();
    const a = new Date(Date.UTC(2026, 8, 21)).toISOString();
    const b = new Date(Date.UTC(2026, 8, 21, 1)).toISOString();
    const fetchChunk = jest.fn().mockRejectedValue(timeout);
    await expect(exportRangeChunked({ fetchChunk, since: a, until: b, sleep })).rejects.toThrow("One hour of logs took too long");

    const c = new Date(Date.UTC(2026, 8, 21, 4)).toISOString();
    const retry = jest.fn().mockRejectedValueOnce(timeout).mockResolvedValue(blobOf(ndjson([])));
    await exportRangeChunked({ fetchChunk: retry, since: a, until: c, chunkMs: 4 * 3_600_000, sleep });
    expect(retry.mock.calls.length).toBeGreaterThan(2);
  });

  test("it pauses briefly between chunks so a long range does not hammer the quota", async () => {
    const fetchChunk = jest.fn().mockResolvedValue(blobOf(ndjson([])));
    const sleep = jest.fn().mockResolvedValue();
    await exportRangeChunked({ fetchChunk, since, until, chunkMs: DAY, sleep });
    expect(fetchChunk).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  test("isRateLimitError reads either error shape", () => {
    expect(isRateLimitError({ response: { status: 429 } })).toBe(true);
    expect(isRateLimitError({ status: 429 })).toBe(true);
    expect(isRateLimitError({ status: 502 })).toBe(false);
  });

  test("reports progress after each chunk", async () => {
    const fetchChunk = jest.fn().mockResolvedValue(blobOf(ndjson([])));
    const onProgress = jest.fn();
    await exportRangeChunked({ fetchChunk, since, until, onProgress, chunkMs: DAY });
    expect(onProgress).toHaveBeenLastCalledWith({ done: 3, total: 3 });
  });
});
