/** Alert payloads are strictly smaller than log records: never forward stacks or raw context. */
export function redactAlertText(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  return raw
    .split(/\r?\n/)[0]
    .replace(/(?:postgres(?:ql)?|mysql|redis|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi, "[connection redacted]")
    .replace(/(?:https?:\/\/)?api\.telegram\.org\/bot[^\s/"']+/gi, "[telegram endpoint]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[url redacted]")
    // Drop query strings and user home paths before sending diagnostics.
    .replace(/\?[^\s"'<>]+/g, "?[query redacted]")
    .replace(/\/(?:home|Users)\/[^\s"'<>]+/gi, "[path redacted]")
    .replace(/\b[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"'<>]+/gi, "[path redacted]")
    // Stable UUID placeholders must precede generic long-token masking, so
    // pre-redacted and raw events yield the same Known Error signature.
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(/\b[A-Za-z0-9_-]{28,}\b/g, "[opaque value]")
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi, "[authorization redacted]")
    .replace(/\b(?:TELEGRAM_ALERT_BOT_TOKEN|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie|authorization|token|otp|session[_-]?id)\b\s*[:=]\s*["']?[^"',;\s}]+/gi, "[credential redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, "[phone redacted]")
    .replace(/\b(?:parameters|params|bindings|values)\s*[:=]\s*(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})/gi, "[sql values redacted]")
    .replace(/\b(?:select|insert|update|delete)\s+.+/gi, "[sql redacted]")
    .replace(/["'\u0060][^"'\u0060]{1,256}["'\u0060]/g, "[value]")
    // Short uploaded filenames are sensitive even without home paths.
    .replace(/\b[^\s\\/:"'<>]{1,120}\.(?:pdf|docx?|xlsx?|pptx?|png|jpe?g|webp|zip|mp4|mov|webm)\b/gi, "[filename redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

/** Static LMS path vocabulary; unknown segments are potentially personal slugs. */
const SAFE_ROUTE_SEGMENTS = new Set(
  ("api tracker logs known-errors viewed client-errors internal alerts tick webhooks telegram " +
   "login logout dashboard ready health auth session users students learner learners " +
   "faculty mentor mentors college colleges admin superadmin super-admin tpo recruiter " +
   "courses course lessons content offerings assignments quizzes assessments projects " +
   "placements drives jobs applications offers screening rounds interviews " +
   "notices announcements settings messages notifications activity audit export " +
   "reports calendar attendance batches departments sections programs terms " +
   "profile profiles organization organizations teams team members memberships " +
   "requests verification public companies candidates pages search filters " +
   "detail overview status history errors error metrics metadata").split(" "),
);

/** Log route templates, never arbitrary user slugs, even if percent-encoded. */
export function safeAlertPath(path: unknown): string {
  if (typeof path !== "string" || !path.startsWith("/")) return "/";
  const pathname = path.split(/[?#]/, 1)[0] ?? "/";
  const segments = pathname.slice(0, 255).split("/").filter(Boolean).slice(0, 16);
  if (segments.length === 0) return "/";
  return "/" + segments.map((raw) => {
    let segment: string;
    try { segment = decodeURIComponent(raw).toLowerCase(); }
    catch { return "[id]"; }
    if (SAFE_ROUTE_SEGMENTS.has(segment)) return segment;
    if (/^\[(?:id|slug|signatureid)\]$/.test(segment)) return "[id]";
    return "[id]";
  }).join("/");
}

export function safeAlertLabel(value: unknown, limit = 80): string {
  if (typeof value !== "string") return "-";
  return redactAlertText(value).replace(/[^a-zA-Z0-9_.:/ \-\[\]]/g, "").slice(0, limit) || "-";
}
