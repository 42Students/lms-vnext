const SECRET_KEY =
  /(password|passwd|secret|token|authorization|cookie|credential|private.?key|api.?key|aadhaar|pan(?:number)?|passport)/i;
const MAX_DEPTH = 5;
const MAX_OBJECT_KEYS = 100;
const MAX_ARRAY_ITEMS = 100;
const MAX_STRING = 2000;

function clean(
  value: unknown,
  depth: number,
): unknown {
  if (depth > MAX_DEPTH) return "[TRUNCATED_DEPTH]";
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return value.length > MAX_STRING
      ? value.slice(0, MAX_STRING) + "…"
      : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => clean(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
      output[key] = SECRET_KEY.test(key)
        ? "[REDACTED]"
        : clean(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

/**
 * Admin activity detail may contain producer-supplied structured context.
 * Never render known credential/identity-secret keys, and cap recursively
 * nested/unbounded values before serializing into the browser.
 */
export function sanitizeActivityMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  return clean(metadata, 0) as Record<string, unknown>;
}
