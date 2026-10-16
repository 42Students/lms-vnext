/**
 * Pure value mappers for the NSRIT stage 2b-i (academics) import. No I/O and
 * no personal data in any return value that could reach a report. Synthetic
 * unit tests: tests/unit/nsrit-migration-academics.test.ts.
 */
import { isRecord } from "./common";
import { str, type Row } from "./mappers";

// -------------------------------------------------------------------- html

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Legacy rich text (HTML) -> safe plain text. Scripts and styles are removed
 * with their content, block tags become line breaks, every other tag is
 * dropped, entities are decoded once. The result can never carry markup.
 */
export function htmlToText(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  let text = raw
    .replace(/<\s*(script|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|tr|h[1-6]|ul|ol|table|blockquote|pre)\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, "");
  text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 8 && code < 0x10ffff ? String.fromCodePoint(code) : " ";
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
  // A second pass removes tags that appeared only after entity decoding.
  text = text.replace(/<[^>]*>/g, "");
  return text
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// -------------------------------------------------------------------- urls

const SIGNED_URL_PARAM =
  /[?&](x-amz-signature|x-amz-credential|x-goog-signature|signature|sig|token|access_token|expires|policy)=/i;

/**
 * Public http(s) URL or null. Credentials in the URL, non-http protocols and
 * URLs that look pre-signed (they expire, so they are not a stable reference)
 * are refused.
 */
export function publicHttpUrl(value: unknown): { url: string | null; signed: boolean } {
  const text = str(value);
  if (!text) return { url: null, signed: false };
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
      return { url: null, signed: false };
    }
    if (SIGNED_URL_PARAM.test(url.search)) return { url: null, signed: true };
    const out = url.toString();
    return out.length <= 2000 ? { url: out, signed: false } : { url: null, signed: false };
  } catch {
    return { url: null, signed: false };
  }
}

// ------------------------------------------------------------------ json

/** content_data and similar columns may arrive as an object or a JSON string. */
export function asJsonObject(value: unknown): Row {
  if (isRecord(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Legacy object-key or file reference reduced to non-identifying facts. */
export function fileReference(file: unknown): Row | null {
  const rec = asJsonObject(file);
  const key = str(rec.cloud_storage_object);
  if (!key) return null;
  const size = Number(rec.size);
  return {
    objectKey: key.slice(0, 500),
    mimetype: str(rec.mimetype)?.slice(0, 120) ?? null,
    sizeBytes: Number.isFinite(size) && size > 0 ? size : null,
  };
}

// ------------------------------------------------------------------- enums

export type AttendanceStatusName = "PRESENT" | "ABSENT" | "EXCUSED" | "MEDICAL" | "LATE";

/**
 * Legacy `attend` rows are absentees. A null/blank status is ABSENT; the
 * AttendanceStatus enum adds EXCUSED, MEDICAL and LATE. Anything else is
 * rejected (never guessed).
 */
export function mapAttendanceStatus(value: unknown): AttendanceStatusName | null {
  const text = (str(value) ?? "ABSENT").toUpperCase();
  return (["PRESENT", "ABSENT", "EXCUSED", "MEDICAL", "LATE"] as const).find((s) => s === text) ?? null;
}

export function mapQuestionType(value: unknown): "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | null {
  const text = (str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  if (text === "SINGLE_CHOICE" || text === "SINGLE") return "SINGLE_CHOICE";
  if (text === "MULTIPLE_CHOICE" || text === "MULTIPLE" || text === "MULTI_CHOICE") return "MULTIPLE_CHOICE";
  return null;
}

export function mapQuizStatus(value: unknown): "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | null {
  const text = (str(value) ?? "").toUpperCase();
  return (["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"] as const).find((s) => s === text) ?? null;
}

export function mapTeachingRole(value: unknown): "PRIMARY" | "CO_TEACHER" | "TA" | null {
  const text = (str(value) ?? "PRIMARY").toUpperCase().replace(/[\s-]+/g, "_");
  if (text === "PRIMARY" || text === "CO_TEACHER" || text === "TA") return text;
  if (text === "ASSISTANT" || text === "TEACHING_ASSISTANT") return "TA";
  return null;
}

export type SubmissionKind = "TEXT" | "LINK" | "FILE";

/** Legacy submission_type -> vNext submission kind (null = nothing submitted). */
export function mapSubmissionKind(value: unknown): SubmissionKind | "UNKNOWN" | null {
  const text = (str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  if (!text) return null;
  if (["WRITTEN_RESPONSE", "TEXT", "TEXT_ENTRY", "HTML"].includes(text)) return "TEXT";
  if (["LINK", "URL", "WEBSITE_URL", "WEB_LINK"].includes(text)) return "LINK";
  if (["PDF_UPLOAD", "FILE", "FILE_UPLOAD", "UPLOAD", "DOCUMENT_UPLOAD"].includes(text)) return "FILE";
  return "UNKNOWN";
}

/** "31,32,34" / "[31,32]" / "31" -> ["31","32","34"] */
export function parseOptionIds(value: unknown): string[] {
  const text = str(value);
  if (!text) return [];
  let items: unknown[];
  try {
    const parsed: unknown = JSON.parse(text);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    items = text.split(/[,;\s]+/);
  }
  const out: string[] = [];
  for (const item of items) {
    const id = String(item ?? "").replace(/[^0-9]/g, "");
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Trimmed text clipped to a maximum length, or null when empty. */
export function plainText(value: unknown, max: number): string | null {
  const text = str(value);
  return text ? text.slice(0, max) : null;
}

// -------------------------------------------------------------- derived math

/** Legacy `getAttendancePercentage`: held sessions only, any `attend` row counts as absent. */
export function legacyAttendancePercent(held: number, absent: number): number | null {
  if (held <= 0) return null;
  return (Math.max(held - absent, 0) / held) * 100;
}

/** Percentage rounded to two decimals so the legacy and vNext figures compare cleanly. */
export function pct2(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100;
}
