const HOUR_MS = 60 * 60 * 1000;
// Measured on prod: a 6h ERROR window returns in ~4s, 12h took ~28s (the load balancer cuts at 30s), 24h 502s.
export const DEFAULT_CHUNK_MS = 6 * HOUR_MS;
export const MIN_CHUNK_MS = HOUR_MS;

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RATE_LIMIT_WAITS_MS = [3000, 6000, 12000];
const PAUSE_BETWEEN_CHUNKS_MS = 250;

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Google Cloud Logging's per-minute read quota; waiting a little clears it. */
export function isRateLimitError(error) {
  return (error?.status ?? error?.response?.status) === 429;
}

const isTimeoutError = (error) => error?.code === "ECONNABORTED";

/** A gateway timeout on a wide range is the one failure worth retrying with a narrower range. */
export function isRetryableChunkError(error) {
  const status = error?.status ?? error?.response?.status;
  if (status) return RETRYABLE_STATUSES.has(status);
  return error?.code === "ECONNABORTED" || error?.code === "ERR_NETWORK";
}

/** Splits [sinceMs, untilMs] into consecutive windows of at most chunkMs, newest window first. */
export function splitRange(sinceMs, untilMs, chunkMs = DEFAULT_CHUNK_MS) {
  const windows = [];
  let end = untilMs;
  while (end > sinceMs) {
    const start = Math.max(sinceMs, end - chunkMs);
    windows.push([start, end]);
    end = start;
  }
  return windows;
}

/** Separates an NDJSON export body into its entry lines and its trailing _meta line (if any). */
export function parseNdjsonExport(text) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  let meta = null;
  const last = lines[lines.length - 1];
  if (last) {
    try {
      const parsed = JSON.parse(last);
      if (parsed && parsed._meta) {
        meta = parsed;
        lines.pop();
      }
    } catch {
      // Not a meta line -- treat every line as an entry.
    }
  }
  return { entries: lines, meta };
}

function entryKey(line) {
  try {
    return JSON.parse(line).insertId || line;
  } catch {
    return line;
  }
}

/**
 * Exports an arbitrary range by requesting it in pieces so no single request outlives the load
 * balancer's timeout. A piece that still times out is halved (down to minChunkMs) and retried.
 * fetchChunk(sinceIso, untilIso) must resolve to { blob } exactly like exportLogs does.
 */
export async function exportRangeChunked({
  fetchChunk,
  since,
  until,
  chunkMs = DEFAULT_CHUNK_MS,
  minChunkMs = MIN_CHUNK_MS,
  onProgress,
  isCancelled = () => false,
  sleep = defaultSleep,
}) {
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  const queue = splitRange(sinceMs, untilMs, chunkMs);
  const totalInitial = queue.length;
  const seen = new Set();
  const lines = [];
  let truncated = false;
  let environment = null;
  let completed = 0;
  let rateLimitHits = 0;

  while (queue.length > 0) {
    if (isCancelled()) throw new Error("Export cancelled.");
    const [start, end] = queue.shift();
    try {
      const { blob } = await fetchChunk(new Date(start).toISOString(), new Date(end).toISOString());
      const { entries, meta } = parseNdjsonExport(await blob.text());
      if (meta?.environment) environment = meta.environment;
      if (meta?.truncated) truncated = true;
      for (const line of entries) {
        const key = entryKey(line);
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push(line);
      }
      completed += 1;
      rateLimitHits = 0;
      if (queue.length > 0 && PAUSE_BETWEEN_CHUNKS_MS > 0) await sleep(PAUSE_BETWEEN_CHUNKS_MS);
      if (onProgress) onProgress({ done: Math.min(completed, totalInitial), total: Math.max(totalInitial, completed + queue.length) });
    } catch (error) {
      if (isRateLimitError(error)) {
        if (rateLimitHits >= RATE_LIMIT_WAITS_MS.length) {
          const limited = new Error("Google Cloud Logging is rate limiting reads right now. Wait a minute, then try again.");
          limited.status = 429;
          throw limited;
        }
        await sleep(RATE_LIMIT_WAITS_MS[rateLimitHits]);
        rateLimitHits += 1;
        queue.unshift([start, end]);
        continue;
      }
      if (!isRetryableChunkError(error)) throw error;
      if (end - start <= minChunkMs) {
        if (isTimeoutError(error)) {
          throw new Error("One hour of logs took too long to read. Try a shorter range, or Errors only.");
        }
        throw error;
      }
      const mid = start + Math.floor((end - start) / 2);
      queue.unshift([mid, end], [start, mid]);
    }
  }

  const meta = {
    _meta: true,
    environment,
    since: new Date(sinceMs).toISOString(),
    until: new Date(untilMs).toISOString(),
    count: lines.length,
    truncated,
  };
  const text = `${lines.join("\n")}${lines.length ? "\n" : ""}${JSON.stringify(meta)}\n`;
  return { text, meta };
}
