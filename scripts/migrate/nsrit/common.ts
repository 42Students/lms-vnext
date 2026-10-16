/**
 * Pure helpers shared by the NSRIT export and loader: deterministic ids,
 * stable hashing, naive IST -> UTC conversion and masking. No I/O here.
 * Nothing in this file may log or return personal data unmasked.
 */
import { createHash } from "node:crypto";

/** Bump when the mapping rules change so source hashes change with them. */
export const LOADER_VERSION = "nsrit-2a-1";
/** Stage 2b-i (academics) rows hash with their own version, so 2a rows stay no-ops. */
export const LOADER_VERSION_2B = "nsrit-2b-1";
/** Stage 2b-ii (placements, projects, notifications) rows hash with their own version. */
export const LOADER_VERSION_2BII = "nsrit-2b-2";
export const SOURCE_SYSTEM = "LMS_LEGACY";

/** Fixed v5 namespace for every NSRIT legacy id. Never change. */
export const NSRIT_NAMESPACE = "6f1c2a52-4e0b-5c53-9a71-0d5b7a3e91c4";

export function uuidV5(name: string, namespace = NSRIT_NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1")
    .update(ns)
    .update(Buffer.from(name, "utf8"))
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Deterministic vNext id for one (target table, legacy table, legacy id). */
export function nsritId(
  newType: string,
  legacyType: string,
  legacyId: string | number,
): string {
  return uuidV5(`${newType}:${legacyType}:${legacyId}`);
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

/** JSON with sorted object keys, so equal data always hashes equally. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

export function sourceHash(value: unknown, version: string = LOADER_VERSION): string {
  return sha256Hex(`${version}|${stableStringify(value)}`);
}

const IST_OFFSET_MINUTES = 330;
const NAIVE_DATETIME =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?$/;

/**
 * Legacy datetimes are naive wall-clock values; owner default (item 14) is
 * that they are IST. Returns an ISO UTC string, or null for empty or
 * unparseable input (callers decide whether null is a rejection).
 */
export function istNaiveToUtcIso(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const match = NAIVE_DATETIME.exec(String(value).trim());
  if (!match) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0", frac = "0"] = match;
  const millis = Number(frac.padEnd(3, "0").slice(0, 3));
  const utcMs =
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), millis) -
    IST_OFFSET_MINUTES * 60_000;
  const date = new Date(utcMs);
  if (Number.isNaN(date.getTime())) return null;
  const check = new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), millis),
  );
  // Reject impossible calendar dates such as 2026-02-31.
  if (check.getUTCMonth() !== Number(mo) - 1 || check.getUTCDate() !== Number(d)) {
    return null;
  }
  return date.toISOString();
}

/** Calendar date (IST) from a legacy naive datetime or date string. */
export function istDateOnly(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso
    ? null
    : iso;
}

// ---------------------------------------------------------------- masking

export function maskLegacyRef(type: string, id: string | number): string {
  return `${type}#${id}`;
}

/** "Sunita R" -> "S*** R***": initials only, word count preserved. */
export function maskName(value: string | null | undefined): string {
  const words = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "-";
  return words
    .slice(0, 4)
    .map((word) => `${Array.from(word)[0]}***`)
    .join(" ");
}

/** Keeps only the last two digits. */
export function maskPhone(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "-";
  return `${"*".repeat(Math.max(digits.length - 2, 4))}${digits.slice(-2)}`;
}

/** Keeps the domain only. */
export function maskEmail(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  const at = text.lastIndexOf("@");
  if (at < 1) return "-";
  return `***@${text.slice(at + 1).toLowerCase()}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Round half up for non-negative and negative decimals alike (away from zero on .5). */
export function roundHalfUp(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}
