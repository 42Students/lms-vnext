/** Alert payloads are strictly smaller than log records: never forward stacks or raw context. */
export function redactAlertText(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  return raw
    .split(/\r?\n/)[0]
    .replace(/(?:postgres(?:ql)?|mysql|redis|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi, "[connection redacted]")
    .replace(/(?:https?:\/\/)?api\.telegram\.org\/bot[^\s/"']+/gi, "[telegram endpoint]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[url redacted]")
    .replace(/\b[A-Za-z0-9_-]{28,}\b/g, "[opaque value]")
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi, "[authorization redacted]")
    .replace(/\b(?:TELEGRAM_ALERT_BOT_TOKEN|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie|authorization)\b\s*[:=]\s*["']?[^"',;\s}]+/gi, "[credential redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, "[phone redacted]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(/\b(?:parameters|params|bindings|values)\s*[:=]\s*(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})/gi, "[sql values redacted]")
    .replace(/\b(?:select|insert|update|delete)\s+.+/gi, "[sql redacted]")
    .replace(/["'\u0060][^"'\u0060]{1,256}["'\u0060]/g, "[value]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

export function safeAlertPath(path: unknown): string {
  if (typeof path !== "string" || !path.startsWith("/")) return "/";
  const pathname = path.split(/[?#]/, 1)[0] ?? "/";
  return pathname.slice(0, 255)
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "/[id]")
    .replace(/\/\d+(?=\/|$)/g, "/[id]")
    .replace(/\/[A-Za-z0-9_-]{32,}(?=\/|$)/g, "/[id]")
    .replace(/[^/a-zA-Z0-9_.[\]-]/g, "");
}

export function safeAlertLabel(value: unknown, limit = 80): string {
  if (typeof value !== "string") return "-";
  return redactAlertText(value).replace(/[^a-zA-Z0-9_.:/ \-\[\]]/g, "").slice(0, limit) || "-";
}
