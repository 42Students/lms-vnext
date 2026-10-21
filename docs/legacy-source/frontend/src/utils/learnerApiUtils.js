/**
 * Learner module - API response normalization and safe data extraction.
 * Use these helpers so malformed or null API responses never cause crashes.
 */

/**
 * Ensures value is an array. Returns empty array for null/undefined/non-array.
 */
export function ensureArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Normalize common API response shape: { status, data?, message? }.
 * Returns { success: boolean, data: T | null, message: string }.
 */
export function normalizeApiResponse(response, defaultValue = null) {
  const data = response?.data ?? response;
  const status = data?.status ?? response?.status;
  const statusStr = typeof status === "string" ? status.toLowerCase() : "";
  const success = statusStr === "success" || statusStr === "ok" || status === 200 || status === true;
  const payload = data?.data !== undefined ? data.data : (success ? data : defaultValue);
  const message = data?.message ?? response?.message ?? "";
  return {
    success: !!success,
    data: payload ?? defaultValue,
    message: typeof message === "string" ? message : "",
  };
}

/**
 * Safe extract list from API response. Returns empty array on any unexpected shape.
 */
export function safeExtractList(response, path) {
  try {
    const data = response?.data ?? response;
    if (!data) return [];
    if (!path || path === "data.data") {
      const list = data?.data;
      return Array.isArray(list) ? list : [];
    }
    const parts = path.split(".");
    let current = data;
    for (const p of parts) {
      current = current?.[p];
      if (current === undefined) return [];
    }
    return Array.isArray(current) ? current : [];
  } catch {
    return [];
  }
}

/**
 * Create an AbortController and return { signal, abort }. Call abort() on cleanup.
 */
export function createRequestController() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
  };
}
