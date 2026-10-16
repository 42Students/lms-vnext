/**
 * Pure value mappers for NSRIT stage 2b-ii (placements, projects,
 * notifications). No I/O, no personal data. Every mapper returns null for an
 * unusable value so callers can decide between a default and a rejection.
 */
import { isRecord, roundHalfUp } from "./common";
import { str, type Counter, type Row } from "./mappers";
import { asJsonObject, publicHttpUrl } from "./mappers-academics";

// ------------------------------------------------------------------ numbers

/** Largest value of numeric(10,2). */
const NUMERIC_10_2_MAX = 99_999_999.99;

/** Lakh-per-annum decimal as a two-decimal string, or null when unusable. */
export function lpaToString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > NUMERIC_10_2_MAX) return null;
  return n.toFixed(2);
}

/** LPA -> whole rupees per year (x100000, round half up); null when unusable or beyond int4. */
export function lpaToInr(value: unknown, counter?: Counter): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  const raw = n * 100_000;
  const rounded = roundHalfUp(raw);
  if (rounded > 2_147_483_647) return null;
  if (counter && Math.abs(rounded - raw) > 1e-6) counter.rounded += 1;
  return rounded;
}

/** Percentage 0..100 -> basis points (x100, round half up); null outside 0..10000. */
export function pctToBasisPoints(value: unknown, counter?: Counter): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const raw = n * 100;
  const rounded = roundHalfUp(raw);
  if (rounded < 0 || rounded > 10_000) return null;
  if (counter && Math.abs(rounded - raw) > 1e-6) counter.rounded += 1;
  return rounded;
}

/** CGPA on a 10 point scale -> hundredths (x100, round half up); null outside 0..1000. */
export function cgpaToHundredths(value: unknown, counter?: Counter): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const raw = n * 100;
  const rounded = roundHalfUp(raw);
  if (rounded < 0 || rounded > 1000) return null;
  if (counter && Math.abs(rounded - raw) > 1e-6) counter.rounded += 1;
  return rounded;
}

export type CtcRange = { minInr: number | null; maxInr: number | null; stipendPerMonth: number | null };

/**
 * Legacy `job.ctc_range` is free text: "3.36-7 LPA", "4.5 LPA", "6 LPA" or a
 * monthly stipend "₹25,000 a month". Stipends are not annual CTC, so they are
 * returned separately and never converted.
 */
export function parseCtcRange(text: unknown): CtcRange {
  const empty: CtcRange = { minInr: null, maxInr: null, stipendPerMonth: null };
  const raw = str(text);
  if (!raw) return empty;
  const month = /([\d][\d,]*(?:\.\d+)?)\s*(?:a|per|\/)\s*month/i.exec(raw);
  if (month) {
    const n = Number(month[1].replace(/,/g, ""));
    return { ...empty, stipendPerMonth: Number.isFinite(n) && n > 0 ? Math.round(n) : null };
  }
  const range = /(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|l\b)/i.exec(raw);
  if (range) {
    const a = lpaToInr(range[1]);
    const b = lpaToInr(range[2]);
    if (a !== null && b !== null) return { minInr: Math.min(a, b), maxInr: Math.max(a, b), stipendPerMonth: null };
  }
  const single = /(\d+(?:\.\d+)?)\s*(?:lpa|lakh|l\b)/i.exec(raw);
  if (single) {
    const a = lpaToInr(single[1]);
    if (a !== null) return { minInr: a, maxInr: a, stipendPerMonth: null };
  }
  return empty;
}

// -------------------------------------------------------------------- enums

export type EmploymentType = "FULL_TIME" | "INTERNSHIP" | "CONTRACT";

export function mapEmploymentType(value: unknown): EmploymentType | null {
  const text = (str(value) ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  if (["fulltime", "permanent", "regular", "fte"].includes(text)) return "FULL_TIME";
  if (["internship", "intern", "trainee"].includes(text)) return "INTERNSHIP";
  if (["contract", "contractual", "parttime", "freelance"].includes(text)) return "CONTRACT";
  return null;
}

export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";

/** Work mode is only implied by the free-text location ("Hyderabad (hybrid)"). */
export function inferWorkMode(location: unknown): WorkMode {
  const text = (str(location) ?? "").toLowerCase();
  if (/\bhybrid\b/.test(text)) return "HYBRID";
  if (/\b(remote|work from home|wfh)\b/.test(text)) return "REMOTE";
  return "ONSITE";
}

/** "Hyderabad (hybrid)" -> ["Hyderabad"]; comma, slash and semicolon separate places. */
export function splitLocations(location: unknown): string[] {
  const text = str(location);
  if (!text) return [];
  const out: string[] = [];
  for (const part of text.split(/[,;/|]/)) {
    const clean = part
      .replace(/\((?:hybrid|remote|onsite|on-site)\)/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    if (clean && !out.some((x) => x.toLowerCase() === clean.toLowerCase())) out.push(clean);
  }
  return out.slice(0, 20);
}

export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | "ARCHIVED";

/** REQUEST = a recruiter drive request waiting for the TPO: it has not been published, so it is a DRAFT. */
export function mapJobLifecycle(value: unknown): { status: JobStatus; wasRequest: boolean } | null {
  const text = (str(value) ?? "").toUpperCase();
  switch (text) {
    case "DRAFT":
      return { status: "DRAFT", wasRequest: false };
    case "REQUEST":
      return { status: "DRAFT", wasRequest: true };
    case "PUBLISHED":
    case "OPEN":
    case "ACTIVE":
      return { status: "PUBLISHED", wasRequest: false };
    case "CLOSED":
      return { status: "CLOSED", wasRequest: false };
    case "CANCELLED":
    case "CANCELED":
      return { status: "CANCELLED", wasRequest: false };
    case "ARCHIVED":
      return { status: "ARCHIVED", wasRequest: false };
    default:
      return null;
  }
}

/** Legacy `job.category` values that mean a dream drive (exempt from the held-offer cap in vNext). */
export function isDreamCategory(value: unknown): boolean {
  return /^(dream|super[\s_-]?dream)$/i.test((str(value) ?? "").trim());
}

export type RoundKind = "TALK" | "TEST" | "VENDOR_TEST" | "GD" | "INTERVIEW";

export function mapRoundKind(value: unknown): RoundKind | null {
  switch ((str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "TALK":
    case "PPT":
    case "PRE_PLACEMENT_TALK":
      return "TALK";
    case "TEST":
    case "ASSESSMENT":
    case "APTITUDE":
    case "CODING":
      return "TEST";
    case "VENDOR_TEST":
      return "VENDOR_TEST";
    case "GD":
    case "GROUP_DISCUSSION":
      return "GD";
    case "INTERVIEW":
    case "TECHNICAL":
    case "HR":
      return "INTERVIEW";
    default:
      return null;
  }
}

export function mapRoundMode(value: unknown): "ON_CAMPUS" | "VIRTUAL" | null {
  switch ((str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "ON_CAMPUS":
    case "IN_PERSON":
    case "OFFLINE":
    case "OFF_CAMPUS":
      return "ON_CAMPUS";
    case "VIRTUAL":
    case "ONLINE":
    case "REMOTE":
      return "VIRTUAL";
    default:
      return null;
  }
}

export type RoundStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

export function mapRoundStatus(value: unknown): RoundStatus | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "PENDING":
    case "DRAFT":
      return "PENDING";
    case "SCHEDULED":
      return "SCHEDULED";
    case "COMPLETED":
    case "DONE":
      return "COMPLETED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    default:
      return null;
  }
}

export type LegacyApplicationStage =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

/** Legacy application_status collapsed to the stages vNext derives from screening, rounds and offers. */
export function mapApplicationStage(value: unknown): LegacyApplicationStage | null {
  switch ((str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "APPLIED":
    case "SUBMITTED":
      return "APPLIED";
    case "SHORTLISTED":
    case "ASSESSMENT":
    case "SCREENING":
      return "SHORTLISTED";
    case "INTERVIEW":
    case "INTERVIEWING":
      return "INTERVIEW";
    case "OFFERED":
    case "OFFER":
      return "OFFERED";
    case "HIRED":
    case "PLACED":
      return "HIRED";
    case "REJECTED":
      return "REJECTED";
    case "WITHDRAWN":
      return "WITHDRAWN";
    default:
      return null;
  }
}

export type OfferStatus = "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";

/** RELEASED = issued to the candidate; REVOKED/CANCELLED (drive cancelled) = withdrawn by the college. */
export function mapOfferStatus(value: unknown): OfferStatus | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "RELEASED":
    case "ISSUED":
    case "OFFERED":
      return "ISSUED";
    case "ACCEPTED":
      return "ACCEPTED";
    case "DECLINED":
    case "REJECTED":
      return "DECLINED";
    case "WITHDRAWN":
    case "REVOKED":
    case "CANCELLED":
    case "CANCELED":
      return "WITHDRAWN";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return null;
  }
}

export function mapOfferKind(value: unknown): "OFFER" | "LOI" {
  return (str(value) ?? "").toUpperCase() === "LOI" ? "LOI" : "OFFER";
}

export function mapAcceptanceChannel(value: unknown): "IN_APP" | "EXTERNAL_IMPORT" | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "IN_APP":
      return "IN_APP";
    case "EXTERNAL_IMPORT":
    case "IMPORT":
    case "TPO_RECORDED":
      return "EXTERNAL_IMPORT";
    default:
      return null;
  }
}

export type RoundOutcome = "PASS" | "FAIL" | "HOLD" | "ABSENT";

export function mapRoundOutcome(value: unknown): RoundOutcome | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "PASS":
    case "PASSED":
    case "SELECTED":
      return "PASS";
    case "FAIL":
    case "FAILED":
    case "REJECTED":
      return "FAIL";
    case "HOLD":
    case "WAITLIST":
    case "WAITLISTED":
      return "HOLD";
    case "ABSENT":
    case "NO_SHOW":
      return "ABSENT";
    default:
      return null;
  }
}

export function mapReasonCategory(value: unknown): "APTITUDE" | "TECHNICAL" | "COMMUNICATION" | "OTHER" | null {
  const text = (str(value) ?? "").toUpperCase();
  if (!text) return null;
  if (["APTITUDE", "TECHNICAL", "COMMUNICATION"].includes(text)) return text as "APTITUDE" | "TECHNICAL" | "COMMUNICATION";
  return "OTHER";
}

export function mapResultSource(value: unknown): "TPO" | "HR" | "IMPORT" {
  const text = (str(value) ?? "").toUpperCase();
  return text === "HR" || text === "RECRUITER" ? "HR" : text === "IMPORT" ? "IMPORT" : "TPO";
}

export type RegistrationChoice =
  | "PLACEMENTS"
  | "HIGHER_STUDIES"
  | "NOT_INTERESTED"
  | "ENTREPRENEURSHIP"
  | "COMPETITIVE_EXAMS";

export function mapRegistrationChoice(value: unknown): RegistrationChoice | null {
  const text = (str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  const known: RegistrationChoice[] = ["PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED", "ENTREPRENEURSHIP", "COMPETITIVE_EXAMS"];
  return (known as string[]).includes(text) ? (text as RegistrationChoice) : null;
}

export function mapShift(value: unknown): "DAY" | "NIGHT" | "FLEXIBLE" | "NO_PREFERENCE" {
  const text = (str(value) ?? "").toLowerCase();
  if (/night/.test(text)) return "NIGHT";
  if (/day/.test(text)) return "DAY";
  if (/flex/.test(text)) return "FLEXIBLE";
  return "NO_PREFERENCE";
}

/** Legacy eligibility scope names -> vNext scope types. */
export function mapEligibilityScope(value: unknown): "COHORT" | "SECTION" | "MEMBERSHIP" | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "BATCH":
    case "COHORT":
      return "COHORT";
    case "CLASS":
    case "SECTION":
      return "SECTION";
    case "LEARNER":
    case "STUDENT":
      return "MEMBERSHIP";
    default:
      return null;
  }
}

const GRANT_CAPABILITY_MAP: Record<string, "DRIVES" | "APPLICANT_EXPORT" | "INTERVIEWS" | "MESSAGES" | null> = {
  DRIVE_REQUEST: "DRIVES",
  DRIVE_WORK: "DRIVES",
  DRIVES: "DRIVES",
  APPLICANTS: "APPLICANT_EXPORT",
  APPLICANT_EXPORT: "APPLICANT_EXPORT",
  EXPORT: "APPLICANT_EXPORT",
  INTERVIEWS: "INTERVIEWS",
  INTERVIEW: "INTERVIEWS",
  MESSAGES: "MESSAGES",
  MESSAGING: "MESSAGES",
  COLLEGE_OVERVIEW: null,
};

/** Legacy recruiter capabilities -> vNext set; unknown or overview-only names are reported, never invented. */
export function mapGrantCapabilities(legacy: string[]): { capabilities: string[]; dropped: string[]; defaulted: boolean } {
  const out = new Set<string>();
  const dropped: string[] = [];
  for (const raw of legacy) {
    const key = raw.trim().toUpperCase();
    const mapped = GRANT_CAPABILITY_MAP[key];
    if (mapped) out.add(mapped);
    else dropped.push(key);
  }
  if (out.size === 0) return { capabilities: ["DRIVES"], dropped, defaulted: true };
  return { capabilities: [...out].sort(), dropped, defaulted: false };
}

export function mapGrantVerification(value: unknown): "PENDING" | "VERIFIED" | "REJECTED" {
  const text = (str(value) ?? "").toUpperCase();
  if (["VERIFIED", "VERIFIED_DOMAIN", "VERIFIED_BY_TPO", "VERIFIED_MANUAL", "TPO_VERIFIED"].includes(text)) return "VERIFIED";
  if (text === "REJECTED") return "REJECTED";
  return "PENDING";
}

// ------------------------------------------------------------------- dates

/** Adds calendar months (clamped to the month end) to an ISO instant. */
export function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString();
}

export function addDaysDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------- slugs

/** vNext project/template keys: lower-case words joined by single hyphens, 1..64 characters. */
export function projectKey(value: unknown, fallback: string, max = 64): string {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return slug || fallback;
}

/** Makes keys unique inside one scope by appending -2, -3 ... (keeps the 64 character limit). */
export function uniqueKey(base: string, used: Set<string>, max = 64): string {
  let candidate = base.slice(0, max).replace(/-+$/g, "") || "item";
  let n = 2;
  while (used.has(candidate)) {
    const tail = `-${n}`;
    candidate = `${base.slice(0, max - tail.length).replace(/-+$/g, "")}${tail}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

// ----------------------------------------------------------------- projects

export type ProjectTaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE";

export function mapTaskStatus(value: unknown): ProjectTaskStatus | null {
  switch ((str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "TO_DO":
    case "TODO":
    case "BACKLOG":
    case "OPEN":
      return "TODO";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "BLOCKED":
      return "BLOCKED";
    case "IN_REVIEW":
    case "REVIEW":
      return "IN_REVIEW";
    case "DONE":
    case "COMPLETED":
    case "COMPLETE":
      return "DONE";
    default:
      return null;
  }
}

export function mapTaskPriority(value: unknown): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  switch ((str(value) ?? "").toUpperCase()) {
    case "LOW":
      return "LOW";
    case "HIGH":
      return "HIGH";
    case "CRITICAL":
    case "URGENT":
      return "CRITICAL";
    default:
      return "MEDIUM";
  }
}

export function mapTaskType(value: unknown): "STORY" | "BUG" | "CHORE" | "SPIKE" | null {
  const text = (str(value) ?? "").toUpperCase();
  return text === "STORY" || text === "BUG" || text === "CHORE" || text === "SPIKE" ? text : null;
}

export function mapSprintState(value: unknown): "PLANNED" | "ACTIVE" | "COMPLETED" | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "PLANNED":
    case "UPCOMING":
    case "DRAFT":
      return "PLANNED";
    case "ACTIVE":
    case "IN_PROGRESS":
    case "STARTED":
      return "ACTIVE";
    case "COMPLETED":
    case "DONE":
    case "CLOSED":
      return "COMPLETED";
    default:
      return null;
  }
}

export function mapReleaseStatus(value: unknown): "PLANNED" | "IN_PROGRESS" | "SHIPPED" {
  switch ((str(value) ?? "").toUpperCase()) {
    case "SHIPPED":
    case "RELEASED":
    case "DONE":
    case "COMPLETED":
      return "SHIPPED";
    case "IN_PROGRESS":
    case "ACTIVE":
      return "IN_PROGRESS";
    default:
      return "PLANNED";
  }
}

export function mapWorkspaceStatus(value: unknown): "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED" | null {
  switch ((str(value) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "ACTIVE":
    case "IN_PROGRESS":
      return "ACTIVE";
    case "PLANNED":
    case "DRAFT":
    case "NOT_STARTED":
      return "PLANNED";
    case "COMPLETED":
    case "DONE":
      return "COMPLETED";
    case "ARCHIVED":
      return "ARCHIVED";
    default:
      return null;
  }
}

export function mapMeetingStatus(value: unknown): "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | null {
  switch ((str(value) ?? "").toUpperCase()) {
    case "REQUESTED":
      return "REQUESTED";
    case "SCHEDULED":
    case "CONFIRMED":
      return "SCHEDULED";
    case "COMPLETED":
    case "DONE":
      return "COMPLETED";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    default:
      return null;
  }
}

export function mapMeetingType(value: unknown): "GENERAL" | "PLANNING" | "STANDUP" | "REVIEW" | "RETRO" {
  const text = (str(value) ?? "").toUpperCase();
  return text === "PLANNING" || text === "STANDUP" || text === "REVIEW" || text === "RETRO" ? text : "GENERAL";
}

/** Legacy IANA aliases: Asia/Calcutta is Asia/Kolkata. */
export function normalizeTimeZone(value: unknown): string {
  const text = str(value);
  if (!text || /^asia\/calcutta$/i.test(text)) return "Asia/Kolkata";
  return text.slice(0, 80);
}

export function mapResourceVisibility(value: unknown): "TEAM" | "MENTOR_ONLY" {
  return /mentor[\s_-]*only|faculty[\s_-]*only|private/i.test(str(value) ?? "") ? "MENTOR_ONLY" : "TEAM";
}

export type DeliveryStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";

export function mapDeliveryStatus(status: unknown, reviewStatus: unknown): DeliveryStatus | null {
  const review = (str(reviewStatus) ?? "").toUpperCase().replace(/[\s-]+/g, "_");
  if (review === "APPROVED" || review === "ACCEPTED") return "APPROVED";
  if (review === "CHANGES_REQUESTED" || review === "NEEDS_REVISION" || review === "REVISION_REQUESTED" || review === "REJECTED") {
    return "CHANGES_REQUESTED";
  }
  switch ((str(status) ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "DRAFT":
      return "DRAFT";
    case "SUBMITTED":
    case "IN_REVIEW":
      return "SUBMITTED";
    case "APPROVED":
      return "APPROVED";
    case "CHANGES_REQUESTED":
    case "NEEDS_REVISION":
      return "CHANGES_REQUESTED";
    default:
      return null;
  }
}

/** Plain text of a legacy JSON text column that may arrive as a string or an array of strings. */
export function textList(value: unknown, maxItems = 50, maxLen = 500): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const out: string[] = [];
  for (const entry of list) {
    const text = typeof entry === "string" ? entry.trim() : isRecord(entry) ? (str(entry.title) ?? str(entry.text) ?? "") : "";
    if (text) out.push(text.slice(0, maxLen));
    if (out.length >= maxItems) break;
  }
  return out;
}

export { asJsonObject, publicHttpUrl };
export type { Row };
