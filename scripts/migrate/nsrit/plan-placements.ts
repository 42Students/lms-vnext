/**
 * Pure planner for NSRIT stage 2b-ii, placements part: companies, college
 * relationships, recruiters and their grants, the season, jobs with role
 * options and eligibility policy, rounds and interview slots, applications
 * with screening and history, round results, offers, batch registration and
 * lifecycle, eligibility decisions, saved jobs and candidate preferences.
 * It builds on the stage 2a plan (deterministic ids of people, cohorts,
 * sections) and never touches a database. Reports carry legacy numeric ids
 * and counts only, never names, contacts or free text.
 *
 * vNext models the pipeline differently from legacy: an application is only
 * SUBMITTED or WITHDRAWN; shortlisting is the screening row, interview
 * progress is the round results and "offered / hired" is the offer row. The
 * legacy status is therefore decomposed (see `decompose` below) and the
 * decomposition is verified again in the derived-number reconciliation.
 */
import {
  LOADER_VERSION_2BII,
  isRecord,
  istDateOnly,
  istNaiveToUtcIso,
  nsritId,
  sourceHash,
} from "./common";
import { junkChildNameReasons, junkReasonsFor, type JunkReason } from "./filters";
import { fullName, normalizeEmail, normalizePhoneE164, str, toIntRoundHalfUp, type Row } from "./mappers";
import {
  addDaysDate,
  addMonthsIso,
  asJsonObject,
  cgpaToHundredths,
  inferWorkMode,
  isDreamCategory,
  lpaToInr,
  lpaToString,
  mapAcceptanceChannel,
  mapApplicationStage,
  mapEligibilityScope,
  mapEmploymentType,
  mapGrantCapabilities,
  mapGrantVerification,
  mapJobLifecycle,
  mapOfferKind,
  mapOfferStatus,
  mapReasonCategory,
  mapRegistrationChoice,
  mapResultSource,
  mapRoundKind,
  mapRoundMode,
  mapRoundOutcome,
  mapRoundStatus,
  mapShift,
  parseCtcRange,
  pctToBasisPoints,
  publicHttpUrl,
  splitLocations,
  type LegacyApplicationStage,
  type OfferStatus,
  type RegistrationChoice,
  type RoundKind,
  type RoundOutcome,
  type RoundStatus,
  type WorkMode,
} from "./mappers-2bii";
import { Collector, type CohortData, type PersonData, type Plan, type Planned, type ProgramData, type Reason, type SectionData } from "./plan";
import type { Snapshot } from "./snapshot";

const idOf = (row: Row) => String(row.id);
const ist = (value: unknown) => istNaiveToUtcIso(str(value));
const isTrue = (value: unknown) => value === 1 || value === "1" || value === true;
const lower = (value: string) => value.toLowerCase();

export class BondAmountPresentError extends Error {
  constructor(where: string) {
    super(`bond_amount has a value in ${where}: its unit is undefined in legacy, the owner must decide before loading`);
    this.name = "LoadAbort";
  }
}
export class UnsupportedLegacyRowsError extends Error {
  constructor(table: string, count: number) {
    super(`Legacy table ${table} has ${count} NSRIT row(s) but no loader exists for it yet: extend the loader before loading`);
    this.name = "LoadAbort";
  }
}

export function item2bii<T>(
  legacyType: string,
  legacyId: string,
  newType: string,
  data: T,
  legacyRow: unknown,
  metadata?: Record<string, unknown>,
  newId?: string,
): Planned<T> {
  return {
    legacyType,
    legacyId,
    newType,
    newId: newId ?? nsritId(newType, legacyType, legacyId),
    hash: sourceHash({ legacy: legacyRow, mapped: data, metadata: metadata ?? null }, LOADER_VERSION_2BII),
    data,
    ...(metadata ? { metadata } : {}),
  };
}

// --------------------------------------------------------------------- types

export type CompanyData = {
  name: string;
  websiteUrl: string | null;
  primaryDomain: string | null;
  status: "ACTIVE";
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RelationshipData = {
  collegeId: string;
  companyId: string;
  isTrusted: boolean;
  ownerMembershipId: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RecruiterUserData = {
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RecruiterProfileData = {
  userId: string;
  companyId: string;
  title: string | null;
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type GrantData = {
  recruiterUserId: string;
  companyRelationshipId: string;
  status: "ACTIVE" | "REVOKED";
  grantedByUserId: string;
  revokedByUserId: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  validUntil: string;
  capabilities: string[];
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string | null;
};
export type ModuleRuleData = {
  scopeId: string;
  module: "projects" | "placements" | "electives";
  enabled: boolean;
  updatedByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type SeasonData = {
  collegeId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
  createdByUserId: string;
  closedByUserId: string | null;
  closedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type JobData = {
  collegeId: string;
  seasonId: string;
  companyRelationshipId: string;
  title: string;
  description: string;
  employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT";
  workMode: WorkMode;
  locations: string[];
  openings: number | null;
  minimumAnnualCtcInr: number | null;
  maximumAnnualCtcInr: number | null;
  applicationMode: "INTERNAL" | "HYBRID" | "EXTERNAL_ONLY";
  externalApplicationUrl: string | null;
  applicationDeadline: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | "ARCHIVED";
  isDream: boolean;
  publishedAt: string | null;
  closedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RoleOptionData = {
  jobId: string;
  title: string;
  employmentType: JobData["employmentType"];
  workMode: WorkMode;
  locations: string[];
  minimumAnnualCtcInr: number | null;
  maximumAnnualCtcInr: number | null;
  fixedLpa: string | null;
  variableLpa: string | null;
  joiningBonusLpa: string | null;
  bondMonths: number | null;
  isPrimary: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
export type PolicyData = {
  jobId: string;
  allowedProgramIds: string[];
  allowedCohortIds: string[];
  allowedSectionIds: string[];
  minCgpaHundredths: number | null;
  minTenthPctBasisPoints: number | null;
  minTwelfthPctBasisPoints: number | null;
  minDiplomaPctBasisPoints: number | null;
  minUndergraduatePctBasisPoints: number | null;
  minPctThroughoutBasisPoints: number | null;
  allowedPassingYears: number[];
  requireVerifiedEvidence: boolean;
  updatedByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RoundData = {
  jobId: string;
  sequence: number;
  kind: RoundKind;
  name: string;
  mode: "ON_CAMPUS" | "VIRTUAL" | null;
  scheduledAt: string | null;
  timezone: string | null;
  venue: string | null;
  meetingUrl: string | null;
  whatToBring: string | null;
  platform: string | null;
  durationMinutes: number | null;
  resultsDueAt: string | null;
  status: RoundStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type SlotData = {
  collegeId: string;
  jobId: string;
  roundId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  mode: "ON_CAMPUS" | "VIRTUAL";
  meetingLocation: string | null;
  panelLabel: string | null;
  capacity: number;
  bookedCount: number;
  status: "PROPOSED" | "OFFERED" | "BOOKED" | "CANCELLED";
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type ApplicationData = {
  jobId: string;
  roleOptionId: string;
  membershipId: string;
  learnerUserId: string;
  channel: "INTERNAL";
  status: "SUBMITTED" | "WITHDRAWN";
  eligibilityStatus: "ELIGIBLE";
  eligibilitySnapshot: Record<string, unknown>;
  submittedByUserId: string;
  submittedAt: string;
  withdrawnAt: string | null;
  updatedAt: string | null;
};
export type AppHistoryData = {
  applicationId: string;
  fromStatus: "SUBMITTED" | null;
  toStatus: "SUBMITTED" | "WITHDRAWN";
  actorUserId: string;
  reason: string | null;
  createdAt: string;
};
export type ScreeningData = {
  applicationId: string;
  status: "PENDING" | "SHORTLISTED" | "REJECTED";
  candidateMessage: string | null;
  internalReason: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  updatedAt: string | null;
};
export type ScreeningHistoryData = {
  applicationId: string;
  fromStatus: "PENDING";
  toStatus: "SHORTLISTED" | "REJECTED";
  candidateMessage: string | null;
  internalReason: string | null;
  actorUserId: string;
  createdAt: string;
};
export type ResultData = {
  roundId: string;
  applicationId: string;
  version: number;
  outcome: RoundOutcome;
  waitlistRank: number | null;
  scorePercent: number | null;
  reasonCategory: "APTITUDE" | "TECHNICAL" | "COMMUNICATION" | "OTHER" | null;
  candidateMessage: string | null;
  internalComment: string | null;
  source: "TPO" | "HR" | "IMPORT";
  status: "STAGED" | "APPLIED" | "SUPERSEDED";
  submittedByUserId: string;
  submittedAt: string;
  appliedByUserId: string | null;
  appliedAt: string | null;
  supersededAt: string | null;
  updatedAt: string | null;
};
export type OfferData = {
  applicationId: string;
  version: number;
  kind: "OFFER" | "LOI";
  status: OfferStatus;
  roleTitle: string;
  annualCtcInr: number | null;
  fixedLpa: string | null;
  variableLpa: string | null;
  joiningBonusLpa: string | null;
  bondMonths: number | null;
  acceptanceChannel: "IN_APP" | "EXTERNAL_IMPORT" | null;
  acceptedDisputableUntil: string | null;
  cascadeId: string | null;
  revokeReason: string | null;
  joiningDate: string | null;
  expiresAt: string | null;
  issuedByUserId: string;
  issuedAt: string;
  respondedByUserId: string | null;
  respondedAt: string | null;
  withdrawnByUserId: string | null;
  withdrawnAt: string | null;
  updatedAt: string | null;
};
export type OfferHistoryData = {
  offerId: string;
  fromStatus: OfferStatus | null;
  toStatus: OfferStatus;
  actorUserId: string;
  reason: string | null;
  cascadeId: string | null;
  createdAt: string;
};
export type BatchLifecycleData = {
  cohortId: string;
  collegeId: string;
  registrationDeadline: string | null;
  invitedAt: string | null;
  finishedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type RegistrationData = {
  collegeId: string;
  cohortId: string;
  membershipId: string;
  choice: RegistrationChoice;
  consentVersion: string | null;
  consentAt: string | null;
  source: "BACKFILL";
  recordedByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
export type EligibilityDecisionData = {
  collegeId: string;
  scopeType: "COHORT" | "SECTION" | "MEMBERSHIP";
  scopeId: string;
  status: "ELIGIBLE" | "INELIGIBLE";
  reason: string | null;
  note: string | null;
  decidedByUserId: string;
  decidedAt: string;
};
export type SavedJobData = {
  collegeId: string;
  membershipId: string;
  jobId: string;
  savedAt: string;
};
export type PreferencesData = {
  membershipId: string;
  preferredRoleTitles: string[];
  preferredLocations: string[];
  shiftPreference: "DAY" | "NIGHT" | "FLEXIBLE" | "NO_PREFERENCE";
  notifyMatchingJobs: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExistingCompanies = {
  /** lower-cased name -> existing company id the loader does not own */
  byName: Map<string, string>;
  /** lower-cased primary domain -> existing company id the loader does not own */
  byDomain: Map<string, string>;
};

export type PlacementsOptions = {
  asOf: Date;
  externalCompanies?: ExistingCompanies;
  externalContacts?: { phones: Set<string>; emails: Set<string> };
};

export type PlacementFacts = {
  /** Legacy-computed numbers over the legacy rows that were planned (verifies the mapping, not the filter). */
  jobs: { job: string; applications: number; offers: number; accepted: number; ctcInr: number }[];
  applications: { application: string; offers: number; stage: LegacyApplicationStage }[];
  placedLearners: string[];
  offerCtcInr: number;
};

export type PlacementsPlan = {
  companies: Planned<CompanyData>[];
  reusedCompanies: Planned<{ existingId: string }>[];
  relationships: Planned<RelationshipData>[];
  recruiterUsers: Planned<RecruiterUserData>[];
  recruiterProfiles: Planned<RecruiterProfileData>[];
  grants: Planned<GrantData>[];
  moduleRules: Planned<ModuleRuleData>[];
  season: Planned<SeasonData>[];
  jobs: Planned<JobData>[];
  roleOptions: Planned<RoleOptionData>[];
  policies: Planned<PolicyData>[];
  rounds: Planned<RoundData>[];
  slots: Planned<SlotData>[];
  applications: Planned<ApplicationData>[];
  appHistory: Planned<AppHistoryData>[];
  screenings: Planned<ScreeningData>[];
  screeningHistory: Planned<ScreeningHistoryData>[];
  results: Planned<ResultData>[];
  offers: Planned<OfferData>[];
  offerHistory: Planned<OfferHistoryData>[];
  batchLifecycles: Planned<BatchLifecycleData>[];
  registrations: Planned<RegistrationData>[];
  decisions: Planned<EligibilityDecisionData>[];
  savedJobs: Planned<SavedJobData>[];
  preferences: Planned<PreferencesData>[];
  facts: PlacementFacts;
  /** Metadata-only references (files and similar) that wait for a later stage. */
  unmappedCounts: Record<string, number>;
};

const REQUIRED = ["job", "job_application", "job_offer", "company", "placement_season"];

// -------------------------------------------------------------- name helpers

const COMPANY_SUFFIX = /\b(ltd|limited|pvt|private|inc|llc|corp|corporation|co|company|technologies|technology|solutions|services|india|group)\b/g;
export function companyKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(COMPANY_SUFFIX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hostOf(value: unknown): string | null {
  const { url } = publicHttpUrl(value);
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
function cleanDomain(value: unknown): string | null {
  const text = (str(value) ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(text) && text.length <= 255 ? text : null;
}

// -------------------------------------------------------------------- planner

type Person = Planned<PersonData>;

export function buildPlacementsPlan(
  snapshot: Snapshot,
  base: Plan,
  collector: Collector,
  options: PlacementsOptions,
  notes: Record<string, number>,
): PlacementsPlan {
  const t = snapshot.tables;
  for (const name of REQUIRED) {
    if (!t[name]) throw new Error(`Snapshot lacks stage 2b-ii table ${name}: re-run the export`);
  }
  const rows = (name: string): Row[] => t[name] ?? [];
  const c = collector;
  const asOfIso = options.asOf.toISOString();
  const rounding = { rounded: 0 };
  const note = (key: string, n = 1) => {
    notes[key] = (notes[key] ?? 0) + n;
  };

  // Tables that exist in the export but whose rows have no loader yet: stop instead of silently dropping.
  for (const name of ["placement_debarment", "external_placement", "learner_academic_record", "interview"]) {
    if (rows(name).length > 0) throw new UnsupportedLegacyRowsError(name, rows(name).length);
  }

  // ---- lookups from stage 2a
  const person = new Map<string, Person>();
  for (const p of base.people) person.set(`${p.legacyType}:${p.legacyId}`, p);
  const learner = (id: unknown) => person.get(`learner:${String(id)}`);
  const faculty = (id: unknown) => person.get(`faculty:${String(id)}`);
  const cohortByBatch = new Map<string, Planned<CohortData>>();
  for (const x of base.cohorts) cohortByBatch.set(x.legacyId, x);
  const sectionByClass = new Map<string, Planned<SectionData>>();
  for (const x of base.sections) sectionByClass.set(x.legacyId, x);
  const programByLegacy = new Map<string, Planned<ProgramData>>();
  for (const x of base.programs) programByLegacy.set(x.legacyId, x);
  const cohortOfLearner = (p: Person) => p.data.enrollment?.cohortId ?? null;

  // ---- actors: legacy faculty id -> loaded user, else a documented fallback
  const faculties = base.people.filter((p) => p.legacyType === "faculty");
  const fallback =
    faculties.find((p) => p.data.roles.includes("COLLEGE_ADMIN")) ??
    faculties.find((p) => p.data.roles.includes("TPO")) ??
    faculties[0];
  if (!fallback) throw new Error("No faculty account is loaded: stage 2a must provide a college admin or TPO to attribute placement actions");
  const actor = (legacyFacultyId: unknown): { userId: string; membershipId: string } => {
    const p = legacyFacultyId === null || legacyFacultyId === undefined ? undefined : faculty(legacyFacultyId);
    if (p) return { userId: p.newId, membershipId: p.data.membershipId };
    note("actorFallback");
    return { userId: fallback.newId, membershipId: fallback.data.membershipId };
  };
  const collegeId = base.college.newId;
  const settings = rows("tpo_college_settings")[0];
  const accessMonthsRaw = Number(settings?.recruiter_access_months);
  const accessMonths = Number.isFinite(accessMonthsRaw) && accessMonthsRaw > 0 ? Math.round(accessMonthsRaw) : 6;

  // ================================================================ companies
  c.stat("company", rows("company").length);
  c.stat("college_company", rows("college_company").length);
  c.stat("company_domain", rows("company_domain").length);
  c.stat("company_alias", rows("company_alias").length);
  const aliasesByCompany = new Map<string, Row[]>();
  for (const a of rows("company_alias")) {
    const list = aliasesByCompany.get(String(a.company_id)) ?? [];
    list.push(a);
    aliasesByCompany.set(String(a.company_id), list);
  }
  const domainsByCompany = new Map<string, Row[]>();
  for (const d of rows("company_domain")) {
    const list = domainsByCompany.get(String(d.company_id)) ?? [];
    list.push(d);
    domainsByCompany.set(String(d.company_id), list);
  }

  const companies: Planned<CompanyData>[] = [];
  const reusedCompanies: Planned<{ existingId: string }>[] = [];
  /** legacy company id (or synthesized key) -> vNext company id */
  const companyId = new Map<string, string>();
  const nameKeys = new Set<string>();
  const domainOwner = new Map<string, string>();
  const companyKeyIndex = new Map<string, string[]>();
  const external = options.externalCompanies;

  const registerCompanyKey = (legacyKey: string, name: string) => {
    const key = companyKey(name);
    if (!key) return;
    const list = companyKeyIndex.get(key) ?? [];
    if (!list.includes(legacyKey)) list.push(legacyKey);
    companyKeyIndex.set(key, list);
  };

  const planCompany = (legacyType: string, legacyKey: string, row: Row, name: string, website: string | null, domainCandidates: string[], createdAt: string | null, updatedAt: string | null) => {
    const existingByName = external?.byName.get(lower(name));
    if (existingByName) {
      companyId.set(legacyKey, existingByName);
      reusedCompanies.push(item2bii(legacyType, legacyKey, "placement_companies_existing", { existingId: existingByName }, row, undefined, existingByName));
      note("companyReusedExisting");
      return;
    }
    let primaryDomain: string | null = null;
    for (const d of domainCandidates) {
      const owner = domainOwner.get(d);
      if ((owner && owner !== legacyKey) || external?.byDomain.has(d)) {
        note("companyDomainConflictDropped");
        continue;
      }
      primaryDomain = d;
      break;
    }
    if (primaryDomain) domainOwner.set(primaryDomain, legacyKey);
    const ownerActor = actor(null);
    const planned = item2bii(
      legacyType,
      legacyKey,
      "placement_companies",
      {
        name,
        websiteUrl: website,
        primaryDomain,
        status: "ACTIVE" as const,
        createdByUserId: ownerActor.userId,
        createdAt,
        updatedAt,
      },
      row,
      domainCandidates.length > 1 ? { unmapped: { extraDomains: domainCandidates.filter((d) => d !== primaryDomain).slice(0, 10) } } : undefined,
    );
    companies.push(planned);
    companyId.set(legacyKey, planned.newId);
  };

  for (const row of [...rows("company")].sort((a, b) => Number(a.id) - Number(b.id))) {
    const name = str(row.name);
    const aliases = (aliasesByCompany.get(idOf(row)) ?? []).map((a) => str(a.alias));
    const reasons: JunkReason[] = junkReasonsFor({ names: [name, ...aliases], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("company", row, reasons[0] as Reason);
      continue;
    }
    if (isTrue(row.is_deleted) === false && row.merged_into_company_id !== null && row.merged_into_company_id !== undefined && String(row.merged_into_company_id) !== "") {
      c.reject("company", row, "MERGED_COMPANY");
      continue;
    }
    if (!name || name.length > 255) {
      c.reject("company", row, "INVALID_VALUE");
      continue;
    }
    if (nameKeys.has(lower(name))) {
      c.reject("company", row, "DUPLICATE_NAME");
      continue;
    }
    nameKeys.add(lower(name));
    const domains = [...(domainsByCompany.get(idOf(row)) ?? [])]
      .sort((a, b) => Number(isTrue(b.verified_by_42)) - Number(isTrue(a.verified_by_42)) || Number(a.id) - Number(b.id))
      .map((d) => cleanDomain(d.domain))
      .filter((d): d is string => d !== null);
    const siteHost = hostOf(row.website);
    const candidates = [...new Set([...domains, ...(siteHost && !domains.includes(siteHost) ? [siteHost] : [])])];
    planCompany("company", idOf(row), row, name, publicHttpUrl(row.website).url, candidates, ist(row.created_at), ist(row.updated_at));
    registerCompanyKey(idOf(row), name);
    for (const alias of aliases) if (alias) registerCompanyKey(idOf(row), alias);
  }
  c.stat("company").planned = companies.length + reusedCompanies.length;
  for (const row of rows("company_domain")) {
    if (companyId.has(String(row.company_id))) c.stat("company_domain").planned += 1;
    else c.reject("company_domain", row, "PARENT_REJECTED");
  }
  for (const row of rows("company_alias")) {
    if (companyId.has(String(row.company_id))) c.stat("company_alias").planned += 1;
    else c.reject("company_alias", row, "PARENT_REJECTED");
  }
  // Domains and aliases have no vNext column of their own beyond the primary domain: they stay as map metadata.
  note("companyDomainsKeptAsMetadata", rows("company_domain").length);

  // ----------------------------------------------- college relationships
  const relationships: Planned<RelationshipData>[] = [];
  const relationshipByCompany = new Map<string, string>();
  const ensureRelationship = (companyKeyLegacy: string, source: Row | null): string | null => {
    const existing = relationshipByCompany.get(companyKeyLegacy);
    if (existing) return existing;
    const vnextCompany = companyId.get(companyKeyLegacy);
    if (!vnextCompany) return null;
    const owner = source ? faculty(source.owner_faculty_id) : undefined;
    const a = actor(null);
    const legacyId = source ? idOf(source) : `company:${companyKeyLegacy}`;
    const planned = item2bii(
      source ? "college_company" : "company",
      source ? legacyId : companyKeyLegacy,
      "placement_company_relationships",
      {
        collegeId,
        companyId: vnextCompany,
        isTrusted: source ? isTrue(source.trusted) : false,
        ownerMembershipId: owner?.data.membershipId ?? null,
        createdByUserId: a.userId,
        createdAt: source ? ist(source.created_at) : null,
        updatedAt: source ? ist(source.updated_at) : null,
      },
      source ?? { companyKey: companyKeyLegacy },
      source
        ? { unmapped: { contactAndNotesDropped: true, joinLinkOpens: source.join_link_opens ?? null, joinLinkJoins: source.join_link_joins ?? null } }
        : undefined,
    );
    relationships.push(planned);
    relationshipByCompany.set(companyKeyLegacy, planned.newId);
    return planned.newId;
  };
  for (const row of rows("college_company")) {
    if (isTrue(row.is_deleted)) {
      c.reject("college_company", row, "SOFT_DELETED");
      continue;
    }
    if (!companyId.has(String(row.company_id))) {
      c.reject("college_company", row, "PARENT_REJECTED");
      continue;
    }
    if (relationshipByCompany.has(String(row.company_id))) {
      c.reject("college_company", row, "DUPLICATE_SOURCE");
      continue;
    }
    ensureRelationship(String(row.company_id), row);
    c.stat("college_company").planned += 1;
  }

  // ================================================================ recruiters
  c.stat("recruiter_college_access", rows("recruiter_college_access").length);
  c.stat("recruiter_college_access_capability", rows("recruiter_college_access_capability").length);
  const recruiterUsers: Planned<RecruiterUserData>[] = [];
  const recruiterProfiles: Planned<RecruiterProfileData>[] = [];
  const grants: Planned<GrantData>[] = [];
  const recruiterLoaded = new Map<string, { userId: string; companyLegacy: string }>();
  const loadedPhones = new Set(base.people.map((p) => p.data.phoneE164).filter((v): v is string => !!v));
  const loadedEmails = new Set(base.people.map((p) => p.data.email).filter((v): v is string => !!v));
  const companyByLegacyRow = new Map<string, Row>();
  for (const r of rows("company")) companyByLegacyRow.set(idOf(r), r);
  const industryByLegacy = new Map<string, Row>();
  for (const r of rows("industry_company")) industryByLegacy.set(idOf(r), r);
  // Stage 2a already screened and reported recruiters (entity "recruiter"); accepted ones were deferred to this stage.
  const deferredRecruiters = new Set(base.deferred.filter((d) => d.entity === "recruiter").map((d) => d.legacyId));
  for (const row of rows("recruiter")) {
    if (!deferredRecruiters.has(idOf(row))) continue;
    const companyRow = companyByLegacyRow.get(String(row.company_id));
    const cid = companyId.get(String(row.company_id));
    if (!cid || !companyRow) {
      c.reject("recruiter", row, "PARENT_REJECTED");
      continue;
    }
    const phone = normalizePhoneE164(row.contact_mobile);
    const email = normalizeEmail(row.contact_mail);
    if ((phone && (loadedPhones.has(phone) || options.externalContacts?.phones.has(phone))) || (email && (loadedEmails.has(email) || options.externalContacts?.emails.has(email)))) {
      c.blocked.push({ entity: "recruiter", legacyId: idOf(row), reason: "BLOCKED_DUPLICATE", group: null });
      continue;
    }
    if (phone) loadedPhones.add(phone);
    if (email) loadedEmails.add(email);
    const userPlanned = item2bii(
      "recruiter",
      idOf(row),
      "users",
      {
        identityUid: `legacy:recruiter:${idOf(row)}`,
        phoneE164: phone,
        email,
        displayName: fullName(row.first_name, row.last_name),
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
    );
    recruiterUsers.push(userPlanned);
    const suspendedAt = ist(row.suspended_at);
    const a = actor(null);
    recruiterProfiles.push(
      item2bii(
        "recruiter",
        idOf(row),
        "placement_recruiter_profiles",
        {
          userId: userPlanned.newId,
          companyId: cid,
          title: str(row.designation)?.slice(0, 160) ?? null,
          status: suspendedAt ? ("ARCHIVED" as const) : ("ACTIVE" as const),
          archivedAt: suspendedAt,
          createdByUserId: a.userId,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
        undefined,
        userPlanned.newId,
      ),
    );
    recruiterLoaded.set(idOf(row), { userId: userPlanned.newId, companyLegacy: String(row.company_id) });
    c.stat("recruiter").planned += 1;
  }
  const capabilitiesByAccess = new Map<string, string[]>();
  for (const cap of rows("recruiter_college_access_capability")) {
    const list = capabilitiesByAccess.get(String(cap.access_id)) ?? [];
    list.push(String(cap.capability ?? ""));
    capabilitiesByAccess.set(String(cap.access_id), list);
  }
  for (const row of rows("recruiter_college_access")) {
    if (isTrue(row.is_deleted)) {
      c.reject("recruiter_college_access", row, "SOFT_DELETED");
      continue;
    }
    const rec = recruiterLoaded.get(String(row.recruiter_id));
    if (!rec) {
      c.reject("recruiter_college_access", row, "PARENT_REJECTED");
      continue;
    }
    const relationshipId = ensureRelationship(rec.companyLegacy, null);
    if (!relationshipId) {
      c.reject("recruiter_college_access", row, "PARENT_REJECTED");
      continue;
    }
    const legacyStatus = (str(row.status) ?? "ACTIVE").toUpperCase();
    const revoked = legacyStatus === "REVOKED" || str(row.revoked_at) !== null;
    if (!["ACTIVE", "REVOKED", "EXPIRED"].includes(legacyStatus) && !revoked) {
      c.reject("recruiter_college_access", row, "UNKNOWN_ENUM");
      continue;
    }
    const grantedAt = ist(row.granted_at) ?? ist(row.created_at) ?? asOfIso;
    const validUntil = ist(row.valid_until) ?? addMonthsIso(grantedAt, accessMonths);
    const revokedAt = revoked ? (ist(row.revoked_at) ?? ist(row.updated_at) ?? grantedAt) : null;
    const caps = mapGrantCapabilities(capabilitiesByAccess.get(idOf(row)) ?? []);
    const verification = mapGrantVerification(row.verification);
    if (!ist(row.valid_until)) note("grantValidityDerivedFromAccessMonths");
    if (!revoked && verification !== "VERIFIED") note("activeGrantNotVerified");
    const granter = actor(row.granted_by_user_id);
    const revoker = actor(row.revoked_by_user_id);
    grants.push(
      item2bii(
        "recruiter_college_access",
        idOf(row),
        "placement_recruiter_college_grants",
        {
          recruiterUserId: rec.userId,
          companyRelationshipId: relationshipId,
          status: revoked ? ("REVOKED" as const) : ("ACTIVE" as const),
          grantedByUserId: granter.userId,
          revokedByUserId: revoked ? revoker.userId : null,
          revokedAt,
          revokeReason: revoked ? (str(row.revoke_reason) ?? "Revoked in the legacy LMS") : null,
          validUntil: validUntil > grantedAt ? validUntil : addMonthsIso(grantedAt, accessMonths),
          capabilities: caps.capabilities,
          verificationStatus: verification,
          createdAt: grantedAt,
          updatedAt: ist(row.updated_at),
        },
        row,
        {
          unmapped: {
            legacyVerification: str(row.verification),
            legacyCapabilities: caps.dropped.length || caps.defaulted ? capabilitiesByAccess.get(idOf(row)) ?? [] : undefined,
            hiringForCompanyId: row.hiring_for_company_id ?? null,
            agencyForCompanyPresent: str(row.agency_for_company_name) !== null,
            reasonIfUnverified:
              !revoked && verification !== "VERIFIED"
                ? "legacy value is not a verified state; vNext keeps the grant PENDING until the TPO verifies it"
                : undefined,
          },
        },
      ),
    );
    c.stat("recruiter_college_access").planned += 1;
  }
  for (const cap of rows("recruiter_college_access_capability")) {
    const hasGrant = grants.some((g) => g.legacyId === String(cap.access_id));
    if (hasGrant) c.stat("recruiter_college_access_capability").planned += 1;
    else c.reject("recruiter_college_access_capability", cap, "PARENT_REJECTED");
  }

  // ============================================================ module switches
  // Legacy app_setting module.<name>.enabled (college scope) -> module_access_rules. Without the
  // placements rule vNext keeps the module off for learners (default false).
  c.stat("app_setting", rows("app_setting").length);
  const moduleRules: Planned<ModuleRuleData>[] = [];
  for (const row of rows("app_setting")) {
    const match = /^module\.(projects|placements|electives)\.enabled$/.exec(str(row.setting_key) ?? "");
    const value = (str(row.setting_value) ?? "").toLowerCase();
    if (!match || (value !== "true" && value !== "false")) {
      c.reject("app_setting", row, "UNKNOWN_ENUM");
      continue;
    }
    const a = actor(null);
    moduleRules.push(
      item2bii(
        "app_setting",
        idOf(row),
        "module_access_rules",
        {
          scopeId: collegeId,
          module: match[1] as ModuleRuleData["module"],
          enabled: value === "true",
          updatedByUserId: a.userId,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
      ),
    );
    c.stat("app_setting").planned += 1;
  }
  if (!t.app_setting) note("moduleRulesNotExported");

  // ================================================================== season
  c.stat("placement_season", rows("placement_season").length);
  const seasons: Planned<SeasonData>[] = [];
  const seasonByLegacy = new Map<string, Planned<SeasonData>>();
  const seasonRows = [...rows("placement_season")].sort((a, b) => Number(a.id) - Number(b.id));
  const currentRow = [...seasonRows].reverse().find((r) => isTrue(r.is_current));
  for (const row of seasonRows) {
    const reasons = junkReasonsFor({ names: [str(row.name)] });
    if (reasons.length) {
      c.reject("placement_season", row, reasons[0] as Reason);
      continue;
    }
    const start = istDateOnly(str(row.start_date));
    if (!start || !str(row.name)) {
      c.reject("placement_season", row, "INVALID_VALUE");
      continue;
    }
    let end = istDateOnly(str(row.end_date));
    if (!end || end < start) {
      end = addDaysDate(start, 365);
      note("seasonEndDateDerived");
    }
    const active = currentRow ? idOf(row) === idOf(currentRow) : seasonRows.indexOf(row) === seasonRows.length - 1;
    const a = actor(null);
    const planned = item2bii(
      "placement_season",
      idOf(row),
      "placement_seasons",
      {
        collegeId,
        name: str(row.name)!.slice(0, 200),
        code: `LEGACY-${idOf(row)}`,
        startDate: start,
        endDate: end,
        status: active ? ("ACTIVE" as const) : ("CLOSED" as const),
        createdByUserId: a.userId,
        closedByUserId: active ? null : a.userId,
        closedAt: active ? null : (ist(row.updated_at) ?? asOfIso),
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
      { unmapped: { registrationOpen: isTrue(row.is_registration_open), blockedDatesPresent: row.blocked_dates !== null } },
    );
    seasons.push(planned);
    seasonByLegacy.set(idOf(row), planned);
  }
  c.stat("placement_season").planned = seasons.length;
  const defaultSeason = seasons.find((s) => s.data.status === "ACTIVE") ?? seasons[seasons.length - 1];

  // ==================================================================== jobs
  c.stat("job", rows("job").length);
  const jobs: Planned<JobData>[] = [];
  const roleOptions: Planned<RoleOptionData>[] = [];
  const policies: Planned<PolicyData>[] = [];
  const jobByLegacy = new Map<string, Planned<JobData>>();
  const rolesByJob = new Map<string, Planned<RoleOptionData>[]>();
  const applicationsPerJob = new Map<string, number>();
  for (const a of rows("job_application")) applicationsPerJob.set(String(a.job_id), (applicationsPerJob.get(String(a.job_id)) ?? 0) + 1);

  const synthesized = new Map<string, string>();
  const resolveJobCompany = (row: Row): string | null => {
    const legacyId = str(row.company_id);
    if (legacyId && companyId.has(legacyId)) return legacyId;
    if (legacyId && !companyId.has(legacyId)) return null; // the company itself was rejected
    // No company id on the job: match by exact name, then by suffix-stripped key (unique match only).
    const name = str(row.company_name);
    if (!name) return null;
    const exact = companies.find((x) => lower(x.data.name) === lower(name));
    if (exact) return exact.legacyId;
    const hits = companyKeyIndex.get(companyKey(name)) ?? [];
    if (hits.length === 1) return hits[0];
    const key = `job-company:${lower(name)}`;
    if (synthesized.has(key)) return key;
    const reasons = junkReasonsFor({ names: [name] });
    if (reasons.length || name.length > 255 || nameKeys.has(lower(name))) return null;
    nameKeys.add(lower(name));
    planCompany("job_company_name", key, { companyName: name }, name, null, [], ist(row.created_at), ist(row.updated_at));
    registerCompanyKey(key, name);
    synthesized.set(key, key);
    note(hits.length > 1 ? "companySynthesizedAmbiguousName" : "companySynthesizedFromJob");
    return key;
  };

  for (const row of [...rows("job")].sort((a, b) => Number(a.id) - Number(b.id))) {
    const title = str(row.job_title);
    const reasons = junkReasonsFor({ names: [title, str(row.company_name)], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("job", row, reasons[0] as Reason);
      continue;
    }
    const lifecycle = mapJobLifecycle(row.lifecycle_status);
    const employmentType = mapEmploymentType(row.job_type);
    if (!lifecycle || !employmentType) {
      c.reject("job", row, "UNKNOWN_ENUM");
      continue;
    }
    if (!title || title.length > 500) {
      c.reject("job", row, "INVALID_VALUE");
      continue;
    }
    const season = (str(row.season_id) ? seasonByLegacy.get(String(row.season_id)) : undefined) ?? defaultSeason;
    if (!season) {
      c.reject("job", row, "NO_SEASON");
      continue;
    }
    if (!str(row.season_id)) note("jobSeasonDefaulted");
    const companyLegacy = resolveJobCompany(row);
    const relationshipId = companyLegacy ? ensureRelationship(companyLegacy, null) : null;
    if (!companyLegacy || !relationshipId) {
      c.reject("job", row, "PARENT_REJECTED");
      continue;
    }
    const creator = actor(row.created_by ?? row.owner_faculty_id);
    const jobId = nsritId("placement_jobs", "job", idOf(row));
    const workMode = inferWorkMode(row.location);
    const locations = splitLocations(row.location);
    // Pay: role options first, the ctc_range text as the headline fallback.
    const roleSource = Array.isArray(row.role_options_json)
      ? (row.role_options_json as unknown[]).filter(isRecord)
      : Array.isArray(asJsonObject(row.role_options_json).options)
        ? ((asJsonObject(row.role_options_json).options as unknown[]).filter(isRecord) as Row[])
        : [];
    const range = parseCtcRange(row.ctc_range);
    const posted = ist(row.posted_date) ?? ist(row.created_at);
    const deadline = ist(row.application_deadline);
    const closedAt =
      lifecycle.status === "CLOSED"
        ? (ist(row.closed_at) ?? ist(row.cancelled_at) ?? ist(row.updated_at))
        : lifecycle.status === "CANCELLED"
          ? (ist(row.cancelled_at) ?? ist(row.closed_at) ?? ist(row.updated_at))
          : null;
    const externalUrl = publicHttpUrl(row.external_apply_url).url;
    if (str(row.external_apply_url) && !externalUrl) note("externalApplyUrlDropped");
    const offCampus = (str(row.drive_mode) ?? "").toUpperCase() === "OFF_CAMPUS";
    const mode: JobData["applicationMode"] = externalUrl
      ? offCampus && !(applicationsPerJob.get(idOf(row)) ?? 0)
        ? "EXTERNAL_ONLY"
        : "HYBRID"
      : "INTERNAL";

    // role options
    const specs: Row[] = roleSource.length ? roleSource : [{ name: title }];
    const usedTitles = new Set<string>();
    const jobRoles: Planned<RoleOptionData>[] = [];
    specs.forEach((spec, index) => {
      if (spec.bondAmount !== null && spec.bondAmount !== undefined && String(spec.bondAmount) !== "") {
        throw new BondAmountPresentError(`job#${idOf(row)} role option`);
      }
      let name = (str(spec.name) ?? title).slice(0, 190);
      if (usedTitles.has(lower(name))) name = `${name} (${index + 1})`;
      usedTitles.add(lower(name));
      const ctc = lpaToInr(spec.ctcLpa, rounding) ?? (lpaToInr((Number(spec.fixedLpa) || 0) + (Number(spec.variableLpa) || 0) || null, rounding));
      const bondMonths = toIntRoundHalfUp(spec.bondMonths);
      jobRoles.push(
        item2bii(
          "job",
          `${idOf(row)}#role${index}`,
          "placement_job_role_options",
          {
            jobId,
            title: name,
            employmentType,
            workMode,
            locations,
            minimumAnnualCtcInr: ctc ?? (roleSource.length ? null : range.minInr),
            maximumAnnualCtcInr: ctc ?? (roleSource.length ? null : range.maxInr),
            fixedLpa: lpaToString(spec.fixedLpa),
            variableLpa: lpaToString(spec.variableLpa),
            joiningBonusLpa: lpaToString(spec.joiningBonusLpa),
            bondMonths: bondMonths !== null && bondMonths >= 0 && bondMonths <= 120 ? bondMonths : null,
            isPrimary: index === 0,
            createdAt: ist(row.created_at),
            updatedAt: ist(row.updated_at),
          },
          { job: idOf(row), index, spec },
          spec.stipendPerMonth || spec.stipendMonths
            ? { unmapped: { stipendPerMonth: spec.stipendPerMonth ?? null, stipendMonths: spec.stipendMonths ?? null } }
            : undefined,
        ),
      );
    });
    if (row.bond_amount !== undefined && row.bond_amount !== null && String(row.bond_amount) !== "") throw new BondAmountPresentError(`job#${idOf(row)}`);
    const roleCtcs = jobRoles.flatMap((r) => [r.data.minimumAnnualCtcInr, r.data.maximumAnnualCtcInr]).filter((v): v is number => v !== null);
    const minCtc = roleCtcs.length ? Math.min(...roleCtcs) : range.minInr;
    const maxCtc = roleCtcs.length ? Math.max(...roleCtcs) : range.maxInr;
    const planned = item2bii(
      "job",
      idOf(row),
      "placement_jobs",
      {
        collegeId,
        seasonId: season.newId,
        companyRelationshipId: relationshipId,
        title: title.slice(0, 500),
        description: str(row.job_description) ?? "No description was recorded in the legacy LMS.",
        employmentType,
        workMode,
        locations,
        openings: null,
        minimumAnnualCtcInr: minCtc,
        maximumAnnualCtcInr: maxCtc,
        applicationMode: mode,
        externalApplicationUrl: externalUrl,
        applicationDeadline: deadline,
        status: lifecycle.status,
        isDream: isDreamCategory(row.category),
        publishedAt: lifecycle.status === "DRAFT" ? null : (posted ?? asOfIso),
        closedAt,
        createdByUserId: creator.userId,
        createdAt: ist(row.created_at),
        updatedAt: ist(row.updated_at),
      },
      row,
      {
        unmapped: {
          wasDriveRequest: lifecycle.wasRequest || undefined,
          category: str(row.category),
          driveMode: str(row.drive_mode),
          importantDates: row.important_dates ?? null,
          candidatePreferences: row.candidate_preferences ?? null,
          cancelledReasonPresent: str(row.cancelled_reason) !== null,
          stipendOnly: range.stipendPerMonth ? range.stipendPerMonth : undefined,
          recruiterId: row.recruiter_id ?? null,
          countsAsPlaced: row.counts_as_placed ?? null,
          assessmentUrlPresent: str(row.assessment_url) !== null,
          jdUrlPresent: str(row.jd_url) !== null,
          externalPortalPresent: str(row.external_portal_url) !== null,
        },
      },
      jobId,
    );
    jobs.push(planned);
    jobByLegacy.set(idOf(row), planned);
    rolesByJob.set(idOf(row), jobRoles);
    roleOptions.push(...jobRoles);
    if (lifecycle.wasRequest) note("jobDriveRequestLoadedAsDraft");
    if (isDreamCategory(row.category)) note("jobDream");

    // eligibility policy
    const el = asJsonObject(row.eligibility_json);
    const programIds = new Set<string>();
    const cohortIds = new Set<string>();
    const sectionIds = new Set<string>();
    for (const pid of Array.isArray(el.programIds) ? (el.programIds as unknown[]) : []) {
      const p = programByLegacy.get(String(pid));
      if (p) programIds.add(p.newId);
      else note("policyProgramUnmapped");
    }
    for (const bid of [...(Array.isArray(el.batchIds) ? (el.batchIds as unknown[]) : []), row.target_batch_id]) {
      if (bid === null || bid === undefined || String(bid) === "") continue;
      const co = cohortByBatch.get(String(bid));
      if (co) cohortIds.add(co.newId);
      else note("policyCohortUnmapped");
    }
    if (row.target_program_id !== null && row.target_program_id !== undefined) {
      const p = programByLegacy.get(String(row.target_program_id));
      if (p) programIds.add(p.newId);
      else note("policyProgramUnmapped");
    }
    if (row.target_class_id !== null && row.target_class_id !== undefined) {
      const s = sectionByClass.get(String(row.target_class_id));
      if (s) sectionIds.add(s.newId);
      else note("policySectionUnmapped");
    }
    const branches = Array.isArray(el.branches) ? (el.branches as unknown[]).map((b) => String(b)) : [];
    for (const b of branches) {
      const hit = base.programs.filter((p) => new RegExp(`\\b${b.replace(/[^A-Za-z0-9]/g, "")}\\b`, "i").test(`${p.data.name} ${p.data.code}`.replace(/[^A-Za-z0-9 ]/g, " ")));
      if (hit.length) hit.forEach((p) => programIds.add(p.newId));
      else note("policyBranchUnmapped");
    }
    const years = (Array.isArray(el.passingYears) ? (el.passingYears as unknown[]) : [])
      .map((y) => Number(y))
      .filter((y) => Number.isInteger(y) && y >= 1950 && y <= 2200);
    policies.push(
      item2bii(
        "job",
        idOf(row),
        "placement_job_eligibility_policies",
        {
          jobId,
          allowedProgramIds: [...programIds],
          allowedCohortIds: [...cohortIds],
          allowedSectionIds: [...sectionIds],
          minCgpaHundredths: cgpaToHundredths(el.minCgpa, rounding),
          minTenthPctBasisPoints: pctToBasisPoints(el.tenthMinPct, rounding),
          minTwelfthPctBasisPoints: pctToBasisPoints(el.twelfthMinPct, rounding),
          minDiplomaPctBasisPoints: pctToBasisPoints(el.diplomaMinPct, rounding),
          minUndergraduatePctBasisPoints: pctToBasisPoints(el.ugMinPct, rounding),
          minPctThroughoutBasisPoints: pctToBasisPoints(el.minPctThroughout, rounding),
          allowedPassingYears: years,
          requireVerifiedEvidence: isTrue(el.verifiedMarksOnly),
          updatedByUserId: creator.userId,
          createdAt: ist(row.created_at),
          updatedAt: ist(row.updated_at),
        },
        row,
        {
          unmapped: {
            gender: el.gender ?? null,
            pgMinPct: el.pgMinPct ?? null,
            targetDepartmentId: row.target_department_id ?? null,
            branches: branches.length ? branches : undefined,
          },
        },
        jobId,
      ),
    );
    c.stat("job").planned += 1;
  }

  // ----------------------------------------------------------------- rounds
  c.stat("job_round", rows("job_round").length);
  const rounds: Planned<RoundData>[] = [];
  const roundByLegacy = new Map<string, Planned<RoundData>>();
  const roundsByJob = new Map<string, Row[]>();
  for (const r of rows("job_round")) roundsByJob.set(String(r.job_id), [...(roundsByJob.get(String(r.job_id)) ?? []), r]);
  for (const [legacyJob, list] of roundsByJob) {
    const job = jobByLegacy.get(legacyJob);
    const ordered = [...list].sort((a, b) => Number(a.seq) - Number(b.seq) || Number(a.id) - Number(b.id));
    if (!job) {
      for (const r of ordered) c.reject("job_round", r, "PARENT_REJECTED");
      continue;
    }
    let sequence = 0;
    for (const r of ordered) {
      const kind = mapRoundKind(r.kind);
      let status = mapRoundStatus(r.status);
      const name = str(r.name);
      if (!kind || !status) {
        c.reject("job_round", r, "UNKNOWN_ENUM");
        continue;
      }
      const reasons = junkChildNameReasons(name);
      if (reasons.length) {
        c.reject("job_round", r, reasons[0] as Reason);
        continue;
      }
      if (!name) {
        c.reject("job_round", r, "INVALID_VALUE");
        continue;
      }
      sequence += 1;
      let mode = mapRoundMode(r.mode);
      let scheduledAt = ist(r.scheduled_date);
      let venue = str(r.venue);
      let meetingUrl = publicHttpUrl(r.meeting_url).url;
      const duration = toIntRoundHalfUp(r.duration_minutes);
      let completedAt: string | null = null;
      let cancelledAt: string | null = null;
      if (status === "SCHEDULED" || status === "COMPLETED") {
        if (!scheduledAt) {
          if (status === "SCHEDULED") {
            status = "PENDING";
            note("roundScheduledWithoutDateAsPending");
          } else {
            scheduledAt = ist(r.updated_at) ?? ist(r.created_at);
            note("roundCompletedDateFromUpdate");
          }
        }
        if (status === "SCHEDULED" || status === "COMPLETED") {
          mode = mode ?? "ON_CAMPUS";
          const delivered = mode === "ON_CAMPUS" ? venue : meetingUrl;
          if (!delivered) {
            if (status === "SCHEDULED") {
              status = "PENDING";
              scheduledAt = null;
              note("roundScheduledWithoutVenueAsPending");
            } else {
              mode = "ON_CAMPUS";
              venue = "Venue was not recorded in the legacy LMS";
              meetingUrl = null;
              note("roundDeliveryDefaulted");
            }
          }
        }
      }
      if (status === "COMPLETED") completedAt = ist(r.updated_at) ?? scheduledAt;
      if (status === "CANCELLED") cancelledAt = ist(r.updated_at) ?? asOfIso;
      if (status === "PENDING") scheduledAt = null;
      const resultsDue = ist(r.results_due);
      const planned = item2bii(
        "job_round",
        idOf(r),
        "placement_job_rounds",
        {
          jobId: job.newId,
          sequence,
          kind,
          name: name.slice(0, 300),
          mode,
          scheduledAt,
          timezone: scheduledAt ? "Asia/Kolkata" : null,
          venue: mode === "ON_CAMPUS" ? venue : null,
          meetingUrl: mode === "VIRTUAL" ? meetingUrl : null,
          whatToBring: str(r.what_to_bring),
          platform: str(r.platform),
          durationMinutes: duration !== null && duration > 0 && duration <= 1440 ? duration : null,
          resultsDueAt: resultsDue && (!scheduledAt || resultsDue >= scheduledAt) ? resultsDue : null,
          status,
          completedAt,
          cancelledAt,
          createdByUserId: job.data.createdByUserId,
          createdAt: ist(r.created_at),
          updatedAt: ist(r.updated_at),
        },
        r,
        { unmapped: { testLinkPresent: str(r.test_link) !== null, addedByRecruiterId: r.added_by_recruiter_id ?? null, legacyStatus: str(r.status), legacySequence: r.seq ?? null } },
      );
      rounds.push(planned);
      roundByLegacy.set(idOf(r), planned);
      c.stat("job_round").planned += 1;
    }
  }

  // ------------------------------------------------------------------ slots
  c.stat("round_slot", rows("round_slot").length);
  c.stat("round_assignment", rows("round_assignment").length);
  const slots: Planned<SlotData>[] = [];
  const assignmentsBySlot = new Map<string, number>();
  for (const a of rows("round_assignment")) {
    if (a.slot_id !== null && a.slot_id !== undefined) assignmentsBySlot.set(String(a.slot_id), (assignmentsBySlot.get(String(a.slot_id)) ?? 0) + 1);
    // Per-learner slot bookings, confirmation and notify stamps have no vNext table: only booked_count is kept.
    c.reject("round_assignment", a, "NO_VNEXT_TARGET");
  }
  for (const s of rows("round_slot")) {
    const round = roundByLegacy.get(String(s.round_id));
    if (!round) {
      c.reject("round_slot", s, "PARENT_REJECTED");
      continue;
    }
    const start = ist(s.starts_at);
    const end = ist(s.ends_at);
    if (!start || !end || end <= start) {
      c.reject("round_slot", s, "INVALID_VALUE");
      continue;
    }
    const capacityRaw = toIntRoundHalfUp(s.capacity) ?? 1;
    const capacity = Math.min(Math.max(capacityRaw, 1), 100);
    const booked = Math.min(assignmentsBySlot.get(idOf(s)) ?? 0, capacity);
    if ((assignmentsBySlot.get(idOf(s)) ?? 0) > capacity) note("slotBookedAboveCapacityClamped");
    const legacy = (str(s.status) ?? "").toUpperCase();
    const status: SlotData["status"] = legacy === "CANCELLED" ? "CANCELLED" : booked > 0 ? "BOOKED" : legacy === "PROPOSED" ? "PROPOSED" : "OFFERED";
    const job = [...jobByLegacy.values()].find((j) => j.newId === round.data.jobId)!;
    slots.push(
      item2bii(
        "round_slot",
        idOf(s),
        "placement_hr_interview_slots",
        {
          collegeId,
          jobId: round.data.jobId,
          roundId: round.newId,
          startAt: start,
          endAt: end,
          timezone: "Asia/Kolkata",
          mode: round.data.mode ?? "ON_CAMPUS",
          meetingLocation: str(s.room),
          panelLabel: str(s.panel)?.slice(0, 160) ?? null,
          capacity,
          bookedCount: booked,
          status,
          createdByUserId: job.data.createdByUserId,
          createdAt: start,
          updatedAt: start,
        },
        s,
        { unmapped: { proposedBy: str(s.proposed_by), legacyStatus: str(s.status) } },
      ),
    );
    c.stat("round_slot").planned += 1;
  }

  // =========================================================== applications
  c.stat("job_application", rows("job_application").length);
  c.stat("application_screening", rows("application_screening").length);
  c.stat("job_application_status_history", rows("job_application_status_history").length);
  const applications: Planned<ApplicationData>[] = [];
  const appHistory: Planned<AppHistoryData>[] = [];
  const screenings: Planned<ScreeningData>[] = [];
  const screeningHistory: Planned<ScreeningHistoryData>[] = [];
  const appByLegacy = new Map<string, { app: Planned<ApplicationData>; row: Row; stage: LegacyApplicationStage; learnerLegacy: string }>();
  const roleMembershipSeen = new Set<string>();
  const historyByApp = new Map<string, Row[]>();
  for (const h of rows("job_application_status_history")) historyByApp.set(String(h.application_id), [...(historyByApp.get(String(h.application_id)) ?? []), h]);
  const offerRowsByApp = new Map<string, Row[]>();
  for (const o of rows("job_offer")) offerRowsByApp.set(String(o.application_id), [...(offerRowsByApp.get(String(o.application_id)) ?? []), o]);

  /** Role option of an application: the offer's role name, a single option, else the primary option. */
  const roleFor = (jobLegacy: string, appRow: Row): Planned<RoleOptionData> | null => {
    const list = rolesByJob.get(jobLegacy) ?? [];
    if (list.length === 0) return null;
    const offerRole = (offerRowsByApp.get(idOf(appRow)) ?? []).map((o) => str(o.role_option_name)).find((n) => n);
    if (offerRole) {
      const hit = list.find((r) => lower(r.data.title) === lower(offerRole));
      if (hit) return hit;
    }
    return list.find((r) => r.data.isPrimary) ?? list[0];
  };

  for (const row of [...rows("job_application")].sort((a, b) => Number(a.id) - Number(b.id))) {
    if (isTrue(row.is_deleted)) {
      c.reject("job_application", row, "SOFT_DELETED");
      continue;
    }
    const job = jobByLegacy.get(String(row.job_id));
    if (!job) {
      c.reject("job_application", row, "PARENT_REJECTED");
      continue;
    }
    const lrn = learner(row.learner_id);
    if (!lrn) {
      c.reject("job_application", row, "PERSON_NOT_LOADED");
      continue;
    }
    const stage = mapApplicationStage(row.application_status);
    if (!stage) {
      c.reject("job_application", row, "UNKNOWN_ENUM");
      continue;
    }
    const role = roleFor(String(row.job_id), row);
    if (!role) {
      c.reject("job_application", row, "NO_ROLE_OPTION");
      continue;
    }
    const dedupe = `${role.newId}|${lrn.data.membershipId}`;
    if (roleMembershipSeen.has(dedupe)) {
      c.reject("job_application", row, "DUPLICATE_SOURCE");
      continue;
    }
    roleMembershipSeen.add(dedupe);
    const submittedAt = ist(row.applied_at) ?? ist(row.created_at) ?? asOfIso;
    const withdrawn = stage === "WITHDRAWN";
    const withdrawnAt = withdrawn ? (ist(row.status_updated_at) ?? ist(row.updated_at) ?? submittedAt) : null;
    const appliedByCollege = isTrue(row.applied_by_college);
    const submitter = appliedByCollege ? actor(row.status_updated_by) : { userId: lrn.newId };
    const planned = item2bii(
      "job_application",
      idOf(row),
      "placement_applications",
      {
        jobId: job.newId,
        roleOptionId: role.newId,
        membershipId: lrn.data.membershipId,
        learnerUserId: lrn.newId,
        channel: "INTERNAL" as const,
        status: withdrawn ? ("WITHDRAWN" as const) : ("SUBMITTED" as const),
        eligibilityStatus: "ELIGIBLE" as const,
        eligibilitySnapshot: { source: "legacy-import", note: "Eligibility was not recorded by the legacy LMS at apply time" },
        submittedByUserId: submitter.userId,
        submittedAt,
        withdrawnAt,
        updatedAt: ist(row.updated_at),
      },
      row,
      {
        unmapped: {
          source: str(row.source),
          appliedByCollege: appliedByCollege || undefined,
          publicRef: str(row.public_ref),
          externalRef: str(row.external_ref),
          papRequested: isTrue(row.pap_requested) || undefined,
          resumePresent: str(row.resume_url) !== null,
          offerLetterPresent: str(row.offer_letter_url) !== null,
          legacyStage: str(row.application_status),
        },
      },
    );
    applications.push(planned);
    appByLegacy.set(idOf(row), { app: planned, row, stage, learnerLegacy: String(row.learner_id) });
    c.stat("job_application").planned += 1;
    if (str(row.resume_url)) note("applicationResumeReferences");

    // status history: the submission, then a withdrawal when there was one
    appHistory.push(
      item2bii("job_application", `${idOf(row)}#submitted`, "placement_application_status_history", { applicationId: planned.newId, fromStatus: null, toStatus: "SUBMITTED" as const, actorUserId: submitter.userId, reason: null, createdAt: submittedAt }, row),
    );
    if (withdrawn && withdrawnAt) {
      appHistory.push(
        item2bii("job_application", `${idOf(row)}#withdrawn`, "placement_application_status_history", { applicationId: planned.newId, fromStatus: "SUBMITTED" as const, toStatus: "WITHDRAWN" as const, actorUserId: lrn.newId, reason: str(row.withdrawal_reason)?.slice(0, 500) ?? null, createdAt: withdrawnAt }, row),
      );
    }
  }

  // legacy application_screening (automated skill scoring) has no vNext target
  for (const s of rows("application_screening")) c.reject("application_screening", s, "NO_VNEXT_TARGET");

  // ------------------------------------------------- round results (before screening: decides REJECTED vs round fail)
  c.stat("round_result", rows("round_result").length);
  const results: Planned<ResultData>[] = [];
  const resultKeys = new Map<string, Row[]>();
  const failedInRound = new Set<string>();
  for (const r of [...rows("round_result")].sort((a, b) => Number(a.id) - Number(b.id))) {
    const round = roundByLegacy.get(String(r.round_id));
    const app = appByLegacy.get(String(r.application_id));
    if (!round || !app) {
      c.reject("round_result", r, "PARENT_REJECTED");
      continue;
    }
    if (round.data.jobId !== app.app.data.jobId) {
      c.reject("round_result", r, "INVALID_VALUE");
      continue;
    }
    const outcome = mapRoundOutcome(r.outcome);
    if (!outcome) {
      c.reject("round_result", r, "UNKNOWN_ENUM");
      continue;
    }
    const key = `${r.round_id}|${r.application_id}`;
    resultKeys.set(key, [...(resultKeys.get(key) ?? []), r]);
  }
  for (const [key, list] of resultKeys) {
    const ordered = [...list].sort((a, b) => (ist(a.submitted_at) ?? "").localeCompare(ist(b.submitted_at) ?? "") || Number(a.id) - Number(b.id));
    const [roundLegacy, appLegacy] = key.split("|");
    const round = roundByLegacy.get(roundLegacy)!;
    const app = appByLegacy.get(appLegacy)!;
    ordered.forEach((r, index) => {
      const outcome = mapRoundOutcome(r.outcome)!;
      const isLast = index === ordered.length - 1;
      const superseded = !isLast || (r.superseded_by !== null && r.superseded_by !== undefined && String(r.superseded_by) !== "");
      const appliedAt = ist(r.applied_at);
      const status: ResultData["status"] = superseded ? "SUPERSEDED" : appliedAt ? "APPLIED" : "STAGED";
      let waitlistRank: number | null = null;
      if (outcome === "HOLD") {
        waitlistRank = toIntRoundHalfUp(r.waitlist_rank);
        if (waitlistRank === null || waitlistRank <= 0) {
          c.reject("round_result", r, "INVALID_VALUE");
          return;
        }
      }
      const scoreRaw = toIntRoundHalfUp(r.score);
      const submitter = actor(r.submitted_by_type === "FACULTY" ? r.submitted_by_id : null);
      const applier = actor(r.applied_by);
      const message =
        outcome === "PASS"
          ? str(r.comment)?.slice(0, 2000) ?? null
          : (str(r.comment) ?? str(app.row.rejection_reason) ?? "Result recorded in the legacy LMS").slice(0, 2000);
      if (outcome !== "PASS" && !str(r.comment) && !str(app.row.rejection_reason)) note("resultCandidateMessageDefaulted");
      const submittedAt = ist(r.submitted_at) ?? ist(r.applied_at) ?? asOfIso;
      results.push(
        item2bii(
          "round_result",
          idOf(r),
          "placement_round_results",
          {
            roundId: round.newId,
            applicationId: app.app.newId,
            version: index + 1,
            outcome,
            waitlistRank,
            scorePercent: scoreRaw !== null && scoreRaw >= 0 && scoreRaw <= 100 ? scoreRaw : null,
            reasonCategory: mapReasonCategory(r.reason_category),
            candidateMessage: message,
            internalComment: outcome === "PASS" ? null : str(r.comment)?.slice(0, 2000) ?? null,
            source: mapResultSource(r.source),
            status,
            submittedByUserId: submitter.userId,
            submittedAt,
            appliedByUserId: status === "APPLIED" ? applier.userId : null,
            appliedAt: status === "APPLIED" ? appliedAt : null,
            supersededAt: status === "SUPERSEDED" ? (appliedAt ?? submittedAt) : null,
            updatedAt: appliedAt ?? submittedAt,
          },
          r,
          scoreRaw !== null && (scoreRaw < 0 || scoreRaw > 100) ? { unmapped: { scoreOutOfRange: true } } : undefined,
        ),
      );
      if (scoreRaw !== null && (scoreRaw < 0 || scoreRaw > 100)) note("resultScoreOutOfRangeDropped");
      c.stat("round_result").planned += 1;
      if (outcome === "FAIL" && status !== "SUPERSEDED") failedInRound.add(appLegacy);
    });
  }

  // ------------------------------------------------------ screening decisions
  const cascade = (value: unknown) => (typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value.toLowerCase() : null);
  for (const [appLegacy, { app, row, stage }] of appByLegacy) {
    const history = (historyByApp.get(appLegacy) ?? []).sort((a, b) => (ist(a.changed_at) ?? "").localeCompare(ist(b.changed_at) ?? "") || Number(a.id) - Number(b.id));
    const decisionRow = history.find((h) => (str(h.old_status) ?? "").toUpperCase() === "APPLIED" && ["SHORTLISTED", "REJECTED"].includes((str(h.new_status) ?? "").toUpperCase()));
    let status: ScreeningData["status"] = "PENDING";
    let candidateMessage: string | null = null;
    let internalReason: string | null = null;
    if (stage === "SHORTLISTED" || stage === "INTERVIEW" || stage === "OFFERED" || stage === "HIRED") status = "SHORTLISTED";
    else if (stage === "REJECTED") {
      // Rejected after a failed round or after an offer was made = shortlisted first; otherwise a screening rejection.
      if (failedInRound.has(appLegacy) || (offerRowsByApp.get(appLegacy) ?? []).length > 0) status = "SHORTLISTED";
      else {
        status = "REJECTED";
        candidateMessage = (str(row.rejection_reason) ?? "Not selected").slice(0, 2000);
      }
    }
    if (status === "REJECTED") internalReason = str(row.internal_reason)?.slice(0, 2000) ?? null;
    const decidedAt = status === "PENDING" ? null : (ist(decisionRow?.changed_at) ?? ist(row.status_updated_at) ?? ist(row.updated_at) ?? asOfIso);
    const decider = actor(decisionRow?.changed_by ?? row.status_updated_by);
    screenings.push(
      item2bii(
        "job_application",
        appLegacy,
        "placement_application_screenings",
        {
          applicationId: app.newId,
          status,
          candidateMessage,
          internalReason,
          decidedByUserId: status === "PENDING" ? null : decider.userId,
          decidedAt,
          updatedAt: decidedAt ?? ist(row.updated_at),
        },
        row,
        undefined,
        app.newId,
      ),
    );
    if (status !== "PENDING" && decidedAt) {
      screeningHistory.push(
        item2bii(
          "job_application",
          `${appLegacy}#screening`,
          "placement_application_screening_history",
          { applicationId: app.newId, fromStatus: "PENDING" as const, toStatus: status, candidateMessage, internalReason, actorUserId: decider.userId, createdAt: decidedAt },
          row,
        ),
      );
    }
  }
  // Legacy history rows: only the first decision maps (to screening history); the later pipeline moves are derived in vNext.
  let historyMapped = 0;
  for (const h of rows("job_application_status_history")) {
    const app = appByLegacy.get(String(h.application_id));
    if (!app) {
      c.reject("job_application_status_history", h, "PARENT_REJECTED");
      continue;
    }
    const oldS = (str(h.old_status) ?? "").toUpperCase();
    const newS = (str(h.new_status) ?? "").toUpperCase();
    if (oldS === "APPLIED" && (newS === "SHORTLISTED" || newS === "REJECTED")) historyMapped += 1;
    else c.reject("job_application_status_history", h, "NO_VNEXT_TARGET");
  }
  c.stat("job_application_status_history").planned = historyMapped;
  c.stat("application_screening").planned = 0;

  // ================================================================== offers
  c.stat("job_offer", rows("job_offer").length);
  const offers: Planned<OfferData>[] = [];
  const offerHistory: Planned<OfferHistoryData>[] = [];
  const offersByApp = new Map<string, Row[]>();
  for (const o of rows("job_offer")) {
    if (o.bond_amount !== null && o.bond_amount !== undefined && String(o.bond_amount) !== "") throw new BondAmountPresentError(`job_offer#${idOf(o)}`);
    const app = appByLegacy.get(String(o.application_id));
    if (!app) {
      c.reject("job_offer", o, "PARENT_REJECTED");
      continue;
    }
    offersByApp.set(String(o.application_id), [...(offersByApp.get(String(o.application_id)) ?? []), o]);
  }
  let expiredAtLoad = 0;
  for (const [appLegacy, list] of offersByApp) {
    const { app } = appByLegacy.get(appLegacy)!;
    const ordered = [...list].sort((a, b) => (ist(a.created_at) ?? "").localeCompare(ist(b.created_at) ?? "") || Number(a.id) - Number(b.id));
    const mapped = ordered.map((o) => ({ o, status: mapOfferStatus(o.status) }));
    mapped.forEach(({ o, status }, index) => {
      if (!status) {
        c.reject("job_offer", o, "UNKNOWN_ENUM");
        return;
      }
      const roleTitle = (str(o.role_option_name) ?? jobs.find((j) => j.newId === app.data.jobId)?.data.title ?? "Offer").slice(0, 300);
      const issuedAt = ist(o.released_at) ?? ist(o.created_at) ?? asOfIso;
      const issuer = actor(o.created_by_id);
      const respondedAtRaw = ist(o.responded_at) ?? ist(o.updated_at) ?? issuedAt;
      let expires = ist(o.respond_by);
      if (expires && expires <= issuedAt) {
        expires = null;
        note("offerExpiryNotAfterIssue");
      }
      // At most one ISSUED/ACCEPTED offer per application: an older active one is withdrawn by the newer offer.
      const laterActive = mapped.slice(index + 1).some((m) => m.status === "ISSUED" || m.status === "ACCEPTED");
      let finalStatus: OfferStatus = status;
      let withdrawnAt: string | null = null;
      let revokeReason: string | null = str(o.revoke_reason)?.slice(0, 500) ?? null;
      if ((status === "ISSUED" || status === "ACCEPTED") && laterActive) {
        finalStatus = "WITHDRAWN";
        withdrawnAt = ist(mapped[index + 1].o.created_at) ?? respondedAtRaw;
        revokeReason = "Superseded by a newer offer (legacy import)";
        note("offerSupersededWithdrawn");
      }
      if (status === "WITHDRAWN") {
        withdrawnAt = ist(o.updated_at) ?? respondedAtRaw;
        revokeReason = revokeReason ?? "Withdrawn in the legacy LMS";
      }
      const responded = finalStatus === "ACCEPTED" || finalStatus === "DECLINED";
      const respondedAt = responded ? respondedAtRaw : null;
      if (finalStatus === "ISSUED" && expires && expires < asOfIso) expiredAtLoad += 1;
      const ctcInr = lpaToInr(o.ctc_lpa, rounding) ?? lpaToInr((Number(o.fixed_lpa) || 0) + (Number(o.variable_lpa) || 0) || null, rounding);
      const bondMonths = toIntRoundHalfUp(o.bond_months);
      const cascadeId = cascade(o.cascade_id);
      const planned = item2bii(
        "job_offer",
        idOf(o),
        "placement_offers",
        {
          applicationId: app.newId,
          version: index + 1,
          kind: mapOfferKind(o.kind),
          status: finalStatus,
          roleTitle,
          annualCtcInr: ctcInr,
          fixedLpa: lpaToString(o.fixed_lpa),
          variableLpa: lpaToString(o.variable_lpa),
          joiningBonusLpa: lpaToString(o.joining_bonus_lpa),
          bondMonths: bondMonths !== null && bondMonths >= 0 && bondMonths <= 120 ? bondMonths : null,
          acceptanceChannel: mapAcceptanceChannel(o.acceptance_channel),
          acceptedDisputableUntil: ist(o.accepted_disputable_until),
          cascadeId,
          revokeReason: finalStatus === "WITHDRAWN" ? revokeReason : null,
          joiningDate: istDateOnly(str(o.joining_date)),
          expiresAt: expires,
          issuedByUserId: issuer.userId,
          issuedAt,
          respondedByUserId: responded ? app.data.learnerUserId : null,
          respondedAt,
          withdrawnByUserId: finalStatus === "WITHDRAWN" ? issuer.userId : null,
          withdrawnAt: finalStatus === "WITHDRAWN" ? withdrawnAt : null,
          updatedAt: ist(o.updated_at),
        },
        o,
        { unmapped: { legacyStatus: str(o.status), letterPresent: str(o.letter_url) !== null, joiningStatus: str(o.joining_status), expiringNotified: str(o.expiring_notified_at) !== null || undefined } },
      );
      offers.push(planned);
      offerHistory.push(
        item2bii("job_offer", `${idOf(o)}#issued`, "placement_offer_status_history", { offerId: planned.newId, fromStatus: null, toStatus: "ISSUED" as const, actorUserId: issuer.userId, reason: null, cascadeId, createdAt: issuedAt }, o),
      );
      if (finalStatus !== "ISSUED") {
        offerHistory.push(
          item2bii(
            "job_offer",
            `${idOf(o)}#${finalStatus.toLowerCase()}`,
            "placement_offer_status_history",
            {
              offerId: planned.newId,
              fromStatus: "ISSUED" as const,
              toStatus: finalStatus,
              actorUserId: responded ? app.data.learnerUserId : issuer.userId,
              reason: finalStatus === "WITHDRAWN" ? revokeReason : null,
              cascadeId,
              createdAt: (responded ? respondedAt : withdrawnAt) ?? issuedAt,
            },
            o,
          ),
        );
      }
      c.stat("job_offer").planned += 1;
    });
  }
  notes.offersIssuedPastExpiry = expiredAtLoad;

  // ================================================== batch, registration, etc.
  c.stat("placement_batch", rows("placement_batch").length);
  const batchLifecycles: Planned<BatchLifecycleData>[] = [];
  const cohortWithLifecycle = new Set<string>();
  for (const b of rows("placement_batch")) {
    const cohort = cohortByBatch.get(String(b.batch_id));
    if (!cohort) {
      c.reject("placement_batch", b, "PARENT_REJECTED");
      continue;
    }
    const invited = ist(b.invited_at);
    const finished = ist(b.finished_at);
    const a = actor(null);
    batchLifecycles.push(
      item2bii(
        "placement_batch",
        String(b.batch_id),
        "placement_batch_lifecycles",
        {
          cohortId: cohort.newId,
          collegeId,
          registrationDeadline: ist(b.registration_deadline),
          invitedAt: invited,
          finishedAt: finished && invited && finished >= invited ? finished : null,
          createdByUserId: a.userId,
          createdAt: ist(b.created_at),
          updatedAt: ist(b.updated_at),
        },
        b,
        { unmapped: { rulesJsonPresent: b.rules_json !== null } },
        cohort.newId,
      ),
    );
    cohortWithLifecycle.add(cohort.newId);
    c.stat("placement_batch").planned += 1;
  }

  c.stat("placement_registration", rows("placement_registration").length);
  const registrations: Planned<RegistrationData>[] = [];
  const registrationSeen = new Set<string>();
  for (const r of rows("placement_registration")) {
    const lrn = learner(r.learner_id);
    if (!lrn) {
      c.reject("placement_registration", r, "PERSON_NOT_LOADED");
      continue;
    }
    const cohortId = cohortOfLearner(lrn);
    if (!cohortId) {
      c.reject("placement_registration", r, "PARENT_REJECTED");
      continue;
    }
    const choice = mapRegistrationChoice(r.choice);
    if (!choice) {
      c.reject("placement_registration", r, "UNKNOWN_ENUM");
      continue;
    }
    const consentAt = ist(r.consent_at);
    const consentVersion = str(r.consent_version)?.slice(0, 32) ?? null;
    if (choice === "PLACEMENTS" && (!consentAt || !consentVersion)) {
      c.reject("placement_registration", r, "NO_CONSENT");
      continue;
    }
    const key = `${lrn.data.membershipId}|${cohortId}`;
    if (registrationSeen.has(key)) {
      c.reject("placement_registration", r, "DUPLICATE_SOURCE");
      continue;
    }
    registrationSeen.add(key);
    const a = actor(null);
    registrations.push(
      item2bii(
        "placement_registration",
        idOf(r),
        "placement_batch_registrations",
        {
          collegeId,
          cohortId,
          membershipId: lrn.data.membershipId,
          choice,
          consentVersion: choice === "PLACEMENTS" ? consentVersion : null,
          consentAt: choice === "PLACEMENTS" ? consentAt : null,
          source: "BACKFILL" as const,
          recordedByUserId: a.userId,
          createdAt: ist(r.created_at),
          updatedAt: ist(r.updated_at),
        },
        r,
        { unmapped: { legacySource: str(r.source), legacySeasonId: r.season_id ?? null, outcomeLabelPresent: str(r.outcome_label) !== null } },
      ),
    );
    c.stat("placement_registration").planned += 1;
  }

  c.stat("placement_eligibility", rows("placement_eligibility").length);
  c.stat("placement_eligibility_event", rows("placement_eligibility_event").length);
  const decisions: Planned<EligibilityDecisionData>[] = [];
  const decisionSeen = new Set<string>();
  for (const d of rows("placement_eligibility")) {
    const scope = mapEligibilityScope(d.scope_type);
    if (!scope) {
      c.reject("placement_eligibility", d, "UNKNOWN_ENUM");
      continue;
    }
    let scopeId: string | undefined;
    if (scope === "COHORT") scopeId = cohortByBatch.get(String(d.scope_id))?.newId;
    else if (scope === "SECTION") scopeId = sectionByClass.get(String(d.scope_id))?.newId;
    else scopeId = learner(d.scope_id)?.data.membershipId;
    if (!scopeId) {
      c.reject("placement_eligibility", d, "PARENT_REJECTED");
      continue;
    }
    const status = (str(d.status) ?? "").toUpperCase();
    if (status !== "ELIGIBLE" && status !== "INELIGIBLE") {
      c.reject("placement_eligibility", d, "UNKNOWN_ENUM");
      continue;
    }
    const reason = str(d.reason)?.slice(0, 200) ?? null;
    if (status === "INELIGIBLE" && !reason) {
      c.reject("placement_eligibility", d, "INVALID_VALUE");
      continue;
    }
    const key = `${scope}|${scopeId}`;
    if (decisionSeen.has(key)) {
      c.reject("placement_eligibility", d, "DUPLICATE_SOURCE");
      continue;
    }
    decisionSeen.add(key);
    const decider = actor(d.decided_by_type === "TPO" || d.decided_by_type === "FACULTY" ? d.decided_by_id : null);
    decisions.push(
      item2bii(
        "placement_eligibility",
        idOf(d),
        "placement_eligibility_decisions",
        {
          collegeId,
          scopeType: scope,
          scopeId,
          status,
          reason: status === "INELIGIBLE" ? reason : null,
          note: str(d.note)?.slice(0, 300) ?? null,
          decidedByUserId: decider.userId,
          decidedAt: ist(d.decided_at) ?? asOfIso,
        },
        d,
      ),
    );
    c.stat("placement_eligibility").planned += 1;
  }
  // Append-only audit history: skipped by owner decision (audit history is not loaded).
  for (const e of rows("placement_eligibility_event")) c.reject("placement_eligibility_event", e, "AUDIT_HISTORY_SKIPPED");

  c.stat("learner_saved_job", rows("learner_saved_job").length);
  const savedJobs: Planned<SavedJobData>[] = [];
  for (const s of rows("learner_saved_job")) {
    const lrn = learner(s.learner_id);
    const job = jobByLegacy.get(String(s.job_id));
    if (!lrn) {
      c.reject("learner_saved_job", s, "PERSON_NOT_LOADED");
      continue;
    }
    if (!job) {
      c.reject("learner_saved_job", s, "PARENT_REJECTED");
      continue;
    }
    savedJobs.push(item2bii("learner_saved_job", idOf(s), "placement_saved_jobs", { collegeId, membershipId: lrn.data.membershipId, jobId: job.newId, savedAt: ist(s.created_at) ?? asOfIso }, s));
    c.stat("learner_saved_job").planned += 1;
  }

  c.stat("job_preferences", rows("job_preferences").length);
  const preferences: Planned<PreferencesData>[] = [];
  const prefSeen = new Set<string>();
  for (const p of rows("job_preferences")) {
    const lrn = learner(p.learner_id);
    if (!lrn) {
      c.reject("job_preferences", p, "PERSON_NOT_LOADED");
      continue;
    }
    if (isTrue(p.is_deleted)) {
      c.reject("job_preferences", p, "SOFT_DELETED");
      continue;
    }
    if (prefSeen.has(lrn.data.membershipId)) {
      c.reject("job_preferences", p, "DUPLICATE_SOURCE");
      continue;
    }
    prefSeen.add(lrn.data.membershipId);
    const roles = [str(p.role_preference), str(p.specific_role_preference)].filter((v): v is string => !!v).map((v) => v.slice(0, 160));
    const city = str(p.preferred_employment_city);
    preferences.push(
      item2bii(
        "job_preferences",
        idOf(p),
        "placement_candidate_preferences",
        {
          membershipId: lrn.data.membershipId,
          preferredRoleTitles: [...new Set(roles)],
          preferredLocations: city ? [city.slice(0, 120)] : [],
          shiftPreference: mapShift(p.work_shift_preference),
          notifyMatchingJobs: p.job_notifications_enabled === null || p.job_notifications_enabled === undefined ? true : isTrue(p.job_notifications_enabled),
          createdAt: ist(p.created_at),
          updatedAt: ist(p.updated_at),
        },
        p,
        {
          // Preserve independent source values in the deterministic, hashed
          // migration plan even though the vNext typed candidate preference
          // row has no PAP/exam-slot columns. Do not infer enums or discard
          // source values that future profile UI/import reconciliation needs.
          legacyPreferenceSnapshotVersion: 1,
          unmapped: {
            papInterest: p.pap_interest ?? null,
            examSlotPreference: p.exam_slot_preference ?? null,
            sourceTable: "job_preferences",
            sourceColumnNames: ["pap_interest", "exam_slot_preference"],
          },
        },
        lrn.data.membershipId,
      ),
    );
    c.stat("job_preferences").planned += 1;
  }

  // ================================================== legacy-computed facts
  const jobFacts = new Map<string, { applications: number; offers: number; accepted: number; ctcInr: number }>();
  for (const { app } of appByLegacy.values()) {
    const job = [...jobByLegacy.entries()].find(([, v]) => v.newId === app.data.jobId)![0];
    const f = jobFacts.get(job) ?? { applications: 0, offers: 0, accepted: 0, ctcInr: 0 };
    f.applications += 1;
    jobFacts.set(job, f);
  }
  const appFacts: PlacementFacts["applications"] = [];
  const appJob = new Map<string, string>();
  for (const [legacyId, { app }] of appByLegacy) {
    appJob.set(legacyId, [...jobByLegacy.entries()].find(([, v]) => v.newId === app.data.jobId)![0]);
  }
  let offerCtcInr = 0;
  for (const [legacyId, v] of appByLegacy) {
    const mappedOffers = (offersByApp.get(legacyId) ?? []).filter((o) => mapOfferStatus(o.status) !== null);
    appFacts.push({ application: legacyId, offers: mappedOffers.length, stage: v.stage });
    const f = jobFacts.get(appJob.get(legacyId)!)!;
    for (const o of mappedOffers) {
      f.offers += 1;
      if (mapOfferStatus(o.status) === "ACCEPTED") {
        f.accepted += 1;
        const inr = lpaToInr(o.ctc_lpa) ?? 0;
        f.ctcInr += inr;
        offerCtcInr += inr;
      }
    }
  }
  const placedLearners = [...new Set([...appByLegacy.values()].filter((v) => v.stage === "HIRED").map((v) => v.learnerLegacy))];
  notes.roundedToInteger = (notes.roundedToInteger ?? 0) + rounding.rounded;

  // ---- unmapped counters (files and other references that wait for a later stage)
  const unmappedCounts: Record<string, number> = {
    applicationResumeReferences: rows("job_application").filter((r) => str(r.resume_url)).length,
    offerLetterReferences: rows("job_offer").filter((r) => str(r.letter_url)).length,
  };

  const planned: PlacementsPlan = {
    companies,
    reusedCompanies,
    relationships,
    recruiterUsers,
    recruiterProfiles,
    grants,
    moduleRules,
    season: seasons,
    jobs,
    roleOptions,
    policies,
    rounds,
    slots,
    applications,
    appHistory,
    screenings,
    screeningHistory,
    results,
    offers,
    offerHistory,
    batchLifecycles,
    registrations,
    decisions,
    savedJobs,
    preferences,
    facts: {
      jobs: [...jobFacts.entries()].map(([job, f]) => ({ job, ...f })),
      applications: appFacts,
      placedLearners,
      offerCtcInr,
    },
    unmappedCounts,
  };
  return planned;
}
