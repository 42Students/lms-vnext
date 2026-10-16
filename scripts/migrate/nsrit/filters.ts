/**
 * Real-data-only filter for the NSRIT import (owner defaults, item 14).
 *
 * Every rule is explicit and documented here; nothing is inferred by a model
 * or a fuzzy score. A row is junk when ANY rule fires. Rules return a short
 * reason code (counted in the reconciliation); the offending text is never
 * returned, so rejection reports stay free of personal data.
 *
 * Rule groups
 *  R1 NAME_E2E        E2E automation tokens ("E2E Dept 1789...").
 *  R2 NAME_TESTWORD   whole words test/testing/tester/dummy/sample/probe/demo/
 *                     smoke/qa, "audit-fix", "slot cap" (elective smoke data).
 *  R3 NAME_MARKUP     HTML/script payloads or XSS probes in a name.
 *  R4 NAME_REPEATED   one character repeated 8+ times (length probes).
 *  R5 NAME_TOO_LONG   longer than 120 characters.
 *  R6 NAME_PLACEHOLDER exact reviewed placeholder names (see PLACEHOLDER_NAMES).
 *  R7 EMAIL_DOMAIN    reserved or test e-mail domains (example.*, testing.com,
 *                     test.com, student.com, mailinator.com, *.test, ...).
 *  R8 EMAIL_LOCAL     local part that is a test token (qa, test, e2e, dummy,
 *                     demo, optionally followed by digits or a separator).
 *  R9 SOFT_DELETED    legacy is_deleted = 1.
 */

export type JunkReason =
  | "NAME_E2E"
  | "NAME_TESTWORD"
  | "NAME_MARKUP"
  | "NAME_REPEATED"
  | "NAME_TOO_LONG"
  | "NAME_PLACEHOLDER"
  | "EMAIL_DOMAIN"
  | "EMAIL_LOCAL"
  | "SOFT_DELETED";

/** Exact (case-insensitive) names reviewed by hand as junk placeholders. */
export const PLACEHOLDER_NAMES: readonly string[] = [
  "abcd",
  "asdf",
  "qwerty",
  "oiuytfgyhuijk",
  "john doe",
  "jane doe",
  "n/a",
  "na",
  "xyz",
  "temp",
  "tmp",
];

const NAME_RULES: { code: JunkReason; test: (text: string) => boolean }[] = [
  { code: "NAME_E2E", test: (t) => /(^|[^a-z])e2e([^a-z]|$)/i.test(t) },
  {
    code: "NAME_TESTWORD",
    test: (t) =>
      /\b(test|tests|testing|tester|dummy|sample|probe|demo|smoke|qa)\b/i.test(t) ||
      /\baudit[\s_-]?fix\b/i.test(t) ||
      /\bslot cap\b/i.test(t),
  },
  {
    code: "NAME_MARKUP",
    test: (t) =>
      /<\s*\/?\s*[a-z!][^>]*>|&lt;|&gt;|javascript:|__xss|onerror\s*=/i.test(t),
  },
  { code: "NAME_REPEATED", test: (t) => /(.)\1{7,}/.test(t) },
  { code: "NAME_TOO_LONG", test: (t) => t.length > 120 },
  {
    code: "NAME_PLACEHOLDER",
    test: (t) => PLACEHOLDER_NAMES.includes(t.trim().toLowerCase()),
  },
];

export function junkNameReasons(...values: (string | null | undefined)[]): JunkReason[] {
  const reasons = new Set<JunkReason>();
  for (const raw of values) {
    const text = String(raw ?? "").trim();
    if (!text) continue;
    for (const rule of NAME_RULES) {
      if (rule.test(text)) reasons.add(rule.code);
    }
  }
  return [...reasons];
}

const TEST_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "testing.com",
  "test.com",
  "student.com",
  "mailinator.com",
  "localhost",
]);
const TEST_EMAIL_SUFFIXES = [".test", ".example", ".invalid", ".local", ".localhost"];

const TEST_LOCAL_PART = /^(qa|test|tester|e2e|dummy|demo|sample)([._+-].*|\d.*)?$/i;

export function emailParts(value: string | null | undefined) {
  const text = String(value ?? "").trim().toLowerCase();
  const at = text.lastIndexOf("@");
  if (at < 1 || at === text.length - 1) return null;
  return { local: text.slice(0, at), domain: text.slice(at + 1) };
}

export function junkEmailReasons(value: string | null | undefined): JunkReason[] {
  const parts = emailParts(value);
  if (!parts) return [];
  const reasons: JunkReason[] = [];
  if (
    TEST_EMAIL_DOMAINS.has(parts.domain) ||
    TEST_EMAIL_SUFFIXES.some((suffix) => parts.domain.endsWith(suffix))
  ) {
    reasons.push("EMAIL_DOMAIN");
  }
  if (TEST_LOCAL_PART.test(parts.local)) reasons.push("EMAIL_LOCAL");
  return reasons;
}

/** Legacy is_deleted may be 0/1, "0"/"1", boolean or null (= false). */
export function isSoftDeleted(value: unknown): boolean {
  return value === 1 || value === "1" || value === true;
}

export function junkReasonsFor(input: {
  names?: (string | null | undefined)[];
  email?: string | null;
  isDeleted?: unknown;
}): JunkReason[] {
  const reasons: JunkReason[] = [];
  if (isSoftDeleted(input.isDeleted)) reasons.push("SOFT_DELETED");
  reasons.push(...junkNameReasons(...(input.names ?? [])));
  reasons.push(...junkEmailReasons(input.email));
  return reasons;
}
