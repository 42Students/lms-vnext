/**
 * Central log redaction. Every structured log line (any severity) passes through this before it is written, so a
 * database error that echoes a row value, a URL carrying a signature, a bearer token or a phone number can never reach
 * the log store, whatever the caller remembered to strip. Pure, no I/O.
 */
const REDACTED = "[redacted]";
const MAX_STRING = 16_000;
const MAX_DEPTH = 6;

/** Object keys whose value is never logged. */
const SENSITIVE_KEY =
  /(pass(word|wd)?|secret|token|otp|authorization|cookie|credential|api[-_]?key|private[-_]?key|signature|digest|session[-_]?id|bearer|x-amz-)/i;

const STRING_RULES: Array<[RegExp, string]> = [
  // Postgres echoes row values: Key (phone_e164)=(+919...) already exists.
  [/\bKey \(([^)]*)\)=\(([^)]*)\)/g, "Key ($1)=([redacted])"],
  [/\bDETAIL:\s*Failing row contains \([^)]*\)/gi, "DETAIL: Failing row contains ([redacted])"],
  // Connection strings and credentials in URLs.
  [/\b(postgres(?:ql)?|mysql|redis|mongodb(?:\+srv)?|amqp):\/\/[^\s"'<>]+/gi, "$1://[redacted]"],
  [/\b(https?:\/\/)[^\s/:@"'<>]+:[^\s/@"'<>]+@/gi, "$1[redacted]@"],
  // Signed URLs.
  [/\b(X-Amz-(?:Signature|Credential|Security-Token)|Signature|sig)=([^&\s"'<>]+)/gi, "$1=[redacted]"],
  // Authorization material.
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g, "Bearer [redacted]"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, "[redacted-jwt]"],
  [/\b(token|otp|code|password|passwd|secret|api[-_]?key|access[-_]?key|session)=([^&\s"'<>]+)/gi, "$1=[redacted]"],
  // Personal identifiers.
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]"],
  [/(?<![\w.])\+\d{8,15}\b/g, "[phone]"],
];

export function redactString(value: string): string {
  let out = value.length > MAX_STRING ? value.slice(0, MAX_STRING) + "...[truncated]" : value;
  for (const [pattern, replacement] of STRING_RULES) out = out.replace(pattern, replacement);
  return out;
}

export function redactLogValue(value: unknown, depth = 0, key = ""): unknown {
  if (key && SENSITIVE_KEY.test(key)) return REDACTED;
  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactLogValue(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
    out[childKey] = redactLogValue(child, depth + 1, childKey);
  }
  return out;
}

/** Fields that identify a log line and must survive untouched. */
const PASS_THROUGH = new Set(["requestId", "severity", "event", "timestamp"]);

export function redactLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = PASS_THROUGH.has(key) ? value : redactLogValue(value, 0, key);
  }
  return out;
}
