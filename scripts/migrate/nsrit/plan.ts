/**
 * Pure planner for the NSRIT stage 2a load: turns a verified snapshot into
 * the exact vNext rows to write (with deterministic UUIDv5 ids), plus the
 * rejection, deferral, duplicate and review lists. No database access and no
 * personal data in any returned report structure (ids and counts only).
 */
import {
  istNaiveToUtcIso,
  maskEmail,
  maskLegacyRef,
  maskName,
  maskPhone,
  nsritId,
  sourceHash,
} from "./common";
import { junkReasonsFor, type JunkReason } from "./filters";
import {
  buildLearnerProfileDocument,
  fullName,
  mapCohortStatus,
  mapFacultyType,
  mapRoomType,
  normalizeEmail,
  normalizePhoneE164,
  parseAcademicYear,
  periodForAcademicYear,
  str,
  toIntRoundHalfUp,
  uniqueCode,
  type MembershipRoleName,
  type PeriodSpec,
  type ProfileBuildStats,
  type Row,
} from "./mappers";
import {
  emptyLearnerProfileDocument,
  learnerProfileDocumentSchema,
} from "../../../src/modules/people/profile-validation";
import type { Snapshot } from "./snapshot";

export type Reason =
  | JunkReason
  | "PARENT_REJECTED"
  | "DUPLICATE_NAME"
  | "INVALID_VALUE"
  | "UNKNOWN_ENUM"
  | "NO_CONTACT"
  | "INVALID_PHONE_NO_EMAIL"
  | "NO_ACCEPTED_COHORT"
  // Stage 2b-i reasons
  | "COURSE_INACTIVE"
  | "ZERO_POINTS"
  | "NO_QUESTIONS"
  | "NOT_SUBMITTED"
  | "ARCHIVED_ELECTIVE"
  | "NO_MEDIA_REFERENCE"
  | "PERSON_NOT_LOADED"
  | "LEARNER_NOT_ACTIVE"
  | "LEARNER_NOT_IN_SECTION"
  | "NO_DELIVERY"
  | "UNSUPPORTED_RECEIVER"
  | "NO_MARKER"
  | "DUPLICATE_SOURCE"
  | "NO_VNEXT_TARGET"
  | "SESSION_NOT_HELD";

export type Rejection = { entity: string; legacyId: string; reason: Reason };
export type Deferral = { entity: string; legacyId: string; reason: string };
export type Blocked = {
  entity: string;
  legacyId: string;
  reason: "BLOCKED_DUPLICATE" | "BLOCKED_DUPLICATE_EXISTING";
  group: number | null;
};

export type Planned<T> = {
  legacyType: string;
  legacyId: string;
  newType: string;
  newId: string;
  hash: string;
  data: T;
  /** Optional non-PII legacy facts stored on the legacy_id_map row (metadata.unmapped). */
  metadata?: Record<string, unknown>;
};

export type OrgData = { name: string; createdAt: string | null; updatedAt: string | null };
export type CollegeData = {
  organizationId: string;
  name: string;
  code: string;
  addressLine1: string | null;
  addressLine2: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type DepartmentData = { name: string; createdAt: string | null; updatedAt: string | null };
export type ProgramData = {
  departmentId: string;
  name: string;
  code: string;
  durationTerms: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type PeriodData = {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: PeriodSpec["status"];
};
export type CohortData = {
  programId: string;
  name: string;
  code: string;
  startPeriodId: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  legacyCurrentSemester: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type SectionData = {
  cohortId: string;
  academicPeriodId: string;
  name: string;
  code: string;
  capacity: number | null;
  minSize: number | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type TermData = {
  programId: string;
  termNumber: number;
  name: string;
  isActive: boolean;
  totalCredits: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type HallData = {
  departmentId: string | null;
  name: string;
  capacity: number;
  description: string | null;
  roomType: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PersonData = {
  personType: "learner" | "faculty";
  identityUid: string;
  phoneE164: string | null;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  membershipId: string;
  membershipStatus: "ACTIVE" | "SUSPENDED";
  suspendedAt: string | null;
  suspensionReason: string | null;
  roles: MembershipRoleName[];
  learner: {
    rollNumber: string | null;
    registrationNumber: string | null;
    document: Record<string, unknown>;
  } | null;
  faculty: {
    primaryDepartmentId: string | null;
    employmentType: string | null;
    academicTitle: string | null;
  } | null;
  enrollment: {
    enrollmentId: string;
    sectionEnrollmentId: string;
    programId: string;
    cohortId: string;
    sectionId: string;
    academicPeriodId: string;
    admittedAt: string | null;
  } | null;
};

export type ReviewGroup = {
  group: number;
  basis: ("PHONE" | "EMAIL")[];
  members: { ref: string; kind: string; name: string; phone: string; email: string; outcome: string }[];
};

export type EntityStat = {
  legacy: number;
  planned: number;
  rejected: Partial<Record<Reason, number>>;
  blockedDuplicate: number;
  deferred: number;
};

export type Plan = {
  organization: Planned<OrgData>;
  college: Planned<CollegeData>;
  departments: Planned<DepartmentData>[];
  programs: Planned<ProgramData>[];
  periods: Planned<PeriodData>[];
  cohorts: Planned<CohortData>[];
  sections: Planned<SectionData>[];
  terms: Planned<TermData>[];
  halls: Planned<HallData>[];
  people: Planned<PersonData>[];
  stats: Record<string, EntityStat>;
  rejections: Rejection[];
  deferred: Deferral[];
  blocked: Blocked[];
  review: ReviewGroup[];
  notes: Record<string, number>;
};

export type PlanOptions = {
  /** Date used to decide PLANNED vs ACTIVE academic periods. */
  today?: Date;
  /** Phones/emails that already belong to users the loader does not own. */
  externalConflicts?: { phones: Set<string>; emails: Set<string> };
};

const idOf = (row: Row) => String(row.id);

export class Collector {
  rejections: Rejection[] = [];
  deferred: Deferral[] = [];
  blocked: Blocked[] = [];
  stats: Record<string, EntityStat> = {};

  stat(entity: string, legacy = 0): EntityStat {
    return (this.stats[entity] ??= {
      legacy,
      planned: 0,
      rejected: {},
      blockedDuplicate: 0,
      deferred: 0,
    });
  }
  reject(entity: string, row: Row, reason: Reason) {
    this.rejections.push({ entity, legacyId: idOf(row), reason });
    const s = this.stat(entity);
    s.rejected[reason] = (s.rejected[reason] ?? 0) + 1;
  }
  defer(entity: string, row: Row, reason: string) {
    this.deferred.push({ entity, legacyId: idOf(row), reason });
    this.stat(entity).deferred += 1;
  }
}

function item<T>(
  legacyType: string,
  legacyId: string,
  newType: string,
  data: T,
  legacyRow: unknown,
): Planned<T> {
  return {
    legacyType,
    legacyId,
    newType,
    newId: nsritId(newType, legacyType, legacyId),
    hash: sourceHash({ legacy: legacyRow, mapped: data }),
    data,
  };
}

const lower = (value: string) => value.toLowerCase();

export function buildPlan(snapshot: Snapshot, options: PlanOptions = {}): Plan {
  const today = options.today ?? new Date();
  const t = snapshot.tables;
  const c = new Collector();
  const notes: Record<string, number> = {
    roundedToInteger: 0,
    profileItemsDropped: 0,
    profileFieldsDropped: 0,
    profileSectionsReset: 0,
    cohortsLegacySemesterAboveOne: 0,
    sectionMinSizeAdjusted: 0,
    programDurationRaisedForTerms: 0,
    hallDepartmentUnmapped: 0,
    facultyDepartmentUnmapped: 0,
    facultyTypeUnknown: 0,
    invalidPhoneDropped: 0,
    invalidEmailDropped: 0,
    learnersWithoutEnrollment: 0,
  };
  const rounding = { rounded: 0 };

  // ---------------------------------------------------------- organization
  const orgRow = t.organization[0];
  const collegeRow = t.college[0];
  if (!orgRow || !collegeRow) throw new Error("Snapshot lacks the NSRIT organization or college row");
  c.stat("organization", t.organization.length);
  c.stat("college", t.college.length);
  const orgData: OrgData = {
    name: str(orgRow.name) ?? "NSRIT",
    createdAt: istNaiveToUtcIso(str(orgRow.created_at)),
    updatedAt: istNaiveToUtcIso(str(orgRow.updated_at)),
  };
  const organization = item("organization", idOf(orgRow), "organizations", orgData, orgRow);
  c.stat("organization").planned = 1;
  const collegeCode = str(collegeRow.unique_id);
  if (!collegeCode) throw new Error("NSRIT college has no unique_id to use as college code");
  const collegeData: CollegeData = {
    organizationId: organization.newId,
    name: str(collegeRow.name) ?? "NSRIT",
    code: collegeCode.slice(0, 64),
    addressLine1: str(collegeRow.address_line1),
    addressLine2: str(collegeRow.address_line2),
    landmark: str(collegeRow.landmark),
    city: str(collegeRow.city),
    state: str(collegeRow.state),
    country: str(collegeRow.country),
    postalCode: str(collegeRow.pin_code),
    createdAt: istNaiveToUtcIso(str(collegeRow.created_at)),
    updatedAt: istNaiveToUtcIso(str(collegeRow.updated_at)),
  };
  const college = item("college", idOf(collegeRow), "colleges", collegeData, collegeRow);
  c.stat("college").planned = 1;

  // ----------------------------------------------------------- departments
  c.stat("department", t.department.length);
  const departments: Planned<DepartmentData>[] = [];
  const deptByLegacy = new Map<string, Planned<DepartmentData>>();
  const deptNames = new Set<string>();
  for (const row of t.department) {
    const name = str(row.name);
    const reasons = junkReasonsFor({ names: [name], isDeleted: row.is_deleted });
    if (!name) reasons.push("INVALID_VALUE" as never);
    if (reasons.length) {
      c.reject("department", row, reasons[0] as Reason);
      continue;
    }
    if (deptNames.has(lower(name!))) {
      c.reject("department", row, "DUPLICATE_NAME");
      continue;
    }
    deptNames.add(lower(name!));
    const planned = item(
      "department",
      idOf(row),
      "departments",
      {
        name: name!,
        createdAt: istNaiveToUtcIso(str(row.created_at)),
        updatedAt: istNaiveToUtcIso(str(row.updated_at)),
      },
      row,
    );
    departments.push(planned);
    deptByLegacy.set(idOf(row), planned);
  }
  c.stat("department").planned = departments.length;

  // -------------------------------------------------------------- programs
  c.stat("program", t.new_program.length);
  const maxTermByProgram = new Map<string, number>();
  for (const s of t.semester) {
    const n = Number(s.semester_number);
    if (Number.isInteger(n)) {
      maxTermByProgram.set(String(s.program_id), Math.max(maxTermByProgram.get(String(s.program_id)) ?? 0, n));
    }
  }
  const programs: Planned<ProgramData>[] = [];
  const programByLegacy = new Map<string, Planned<ProgramData>>();
  const programNames = new Set<string>();
  for (const row of t.new_program) {
    const dept = deptByLegacy.get(String(row.dept_id));
    const name = str(row.name);
    const reasons = junkReasonsFor({ names: [name], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("program", row, reasons[0] as Reason);
      continue;
    }
    if (!dept) {
      c.reject("program", row, "PARENT_REJECTED");
      continue;
    }
    if (!name) {
      c.reject("program", row, "INVALID_VALUE");
      continue;
    }
    const years = toIntRoundHalfUp(row.duration_years, rounding);
    let durationTerms = Math.max(1, (years ?? 1) * 2);
    const maxTerm = maxTermByProgram.get(idOf(row)) ?? 0;
    if (maxTerm > durationTerms) {
      durationTerms = maxTerm;
      notes.programDurationRaisedForTerms += 1;
    }
    if (durationTerms > 24) {
      c.reject("program", row, "INVALID_VALUE");
      continue;
    }
    const key = `${dept.newId}|${lower(name)}`;
    if (programNames.has(key)) {
      c.reject("program", row, "DUPLICATE_NAME");
      continue;
    }
    programNames.add(key);
    const planned = item(
      "new_program",
      idOf(row),
      "programs",
      {
        departmentId: dept.newId,
        name,
        code: uniqueCode(name, idOf(row)),
        durationTerms,
        createdAt: istNaiveToUtcIso(str(row.created_at)),
        updatedAt: istNaiveToUtcIso(str(row.updated_at)),
      },
      row,
    );
    programs.push(planned);
    programByLegacy.set(idOf(row), planned);
  }
  c.stat("program").planned = programs.length;

  // ------------------------------------------------- batches -> cohorts
  c.stat("batch", t.batch.length);
  const periods: Planned<PeriodData>[] = [];
  const periodByKey = new Map<string, Planned<PeriodData>>();
  const cohorts: Planned<CohortData>[] = [];
  const cohortByLegacy = new Map<string, Planned<CohortData>>();
  for (const row of t.batch) {
    const program = programByLegacy.get(String(row.program_id));
    const name = str(row.batch_name);
    const reasons = junkReasonsFor({ names: [name, str(row.academic_year)] });
    if (reasons.length) {
      c.reject("batch", row, reasons[0] as Reason);
      continue;
    }
    if (!program) {
      c.reject("batch", row, "PARENT_REJECTED");
      continue;
    }
    const startYear = parseAcademicYear(row.academic_year);
    const status = mapCohortStatus(row.status);
    if (!name || startYear === null) {
      c.reject("batch", row, "INVALID_VALUE");
      continue;
    }
    if (!status) {
      c.reject("batch", row, "UNKNOWN_ENUM");
      continue;
    }
    const spec = periodForAcademicYear(startYear, today);
    let period = periodByKey.get(spec.key);
    if (!period) {
      period = item(
        "academic_year",
        spec.key,
        "academic_periods",
        {
          name: spec.name,
          code: spec.code,
          startDate: spec.startDate,
          endDate: spec.endDate,
          status: spec.status,
        },
        spec,
      );
      periodByKey.set(spec.key, period);
      periods.push(period);
    }
    const legacySemester = toIntRoundHalfUp(row.current_semester, rounding);
    if (legacySemester !== null && legacySemester > 1) notes.cohortsLegacySemesterAboveOne += 1;
    const planned = item(
      "batch",
      idOf(row),
      "cohorts",
      {
        programId: program.newId,
        name,
        code: uniqueCode(name, idOf(row)),
        startPeriodId: period.newId,
        status,
        legacyCurrentSemester: legacySemester,
        createdAt: istNaiveToUtcIso(str(row.created_at)),
        updatedAt: istNaiveToUtcIso(str(row.updated_at)),
      },
      row,
    );
    cohorts.push(planned);
    cohortByLegacy.set(idOf(row), planned);
  }
  c.stat("batch").planned = cohorts.length;
  c.stat("academic_period", 0).planned = periods.length;

  // ------------------------------------------------------ classes -> sections
  c.stat("class", t.class.length);
  const sections: Planned<SectionData>[] = [];
  const sectionByLegacy = new Map<string, Planned<SectionData>>();
  const sectionNames = new Set<string>();
  for (const row of t.class) {
    const name = str(row.name);
    const reasons = junkReasonsFor({ names: [name], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("class", row, reasons[0] as Reason);
      continue;
    }
    if (String(row.class_type ?? "SECTION").toUpperCase() !== "SECTION") {
      c.defer("class", row, "GROUP_BACKED_ELECTIVE_GRAPH_2B");
      continue;
    }
    const cohort = cohortByLegacy.get(String(row.batch_id));
    if (!cohort) {
      c.reject("class", row, row.batch_id ? "PARENT_REJECTED" : "NO_ACCEPTED_COHORT");
      continue;
    }
    if (!name) {
      c.reject("class", row, "INVALID_VALUE");
      continue;
    }
    const upper = toIntRoundHalfUp(row.upper_limit, rounding);
    const lowerLimit = toIntRoundHalfUp(row.lower_limit, rounding);
    const capacity = upper !== null && upper > 0 ? upper : null;
    let minSize: number | null = null;
    if (lowerLimit !== null && lowerLimit >= 0) {
      if (capacity === null || lowerLimit <= capacity) minSize = lowerLimit;
      else notes.sectionMinSizeAdjusted += 1;
    }
    const key = `${cohort.newId}|${cohort.data.startPeriodId}|${lower(name)}`;
    if (sectionNames.has(key)) {
      c.reject("class", row, "DUPLICATE_NAME");
      continue;
    }
    sectionNames.add(key);
    const planned = item(
      "class",
      idOf(row),
      "sections",
      {
        cohortId: cohort.newId,
        academicPeriodId: cohort.data.startPeriodId,
        name,
        code: uniqueCode(name, idOf(row)),
        capacity,
        minSize,
        description: str(row.description),
        createdAt: istNaiveToUtcIso(str(row.created_at)),
        updatedAt: istNaiveToUtcIso(str(row.updated_at)),
      },
      row,
    );
    sections.push(planned);
    sectionByLegacy.set(idOf(row), planned);
  }
  c.stat("class").planned = sections.length;

  // ------------------------------------------------- semesters -> terms
  c.stat("semester", t.semester.length);
  const terms: Planned<TermData>[] = [];
  const termKeys = new Set<string>();
  for (const row of t.semester) {
    const program = programByLegacy.get(String(row.program_id));
    const name = str(row.name);
    const reasons = junkReasonsFor({ names: [name], isDeleted: row.is_deleted });
    if (reasons.length) {
      c.reject("semester", row, reasons[0] as Reason);
      continue;
    }
    if (!program) {
      c.reject("semester", row, "PARENT_REJECTED");
      continue;
    }
    const number = toIntRoundHalfUp(row.semester_number, rounding);
    const credits = toIntRoundHalfUp(row.total_credits, rounding);
    if (number === null || number < 1 || (credits !== null && credits < 0)) {
      c.reject("semester", row, "INVALID_VALUE");
      continue;
    }
    const key = `${program.newId}|${number}`;
    if (termKeys.has(key)) {
      c.reject("semester", row, "DUPLICATE_NAME");
      continue;
    }
    termKeys.add(key);
    terms.push(
      item(
        "semester",
        idOf(row),
        "program_terms",
        {
          programId: program.newId,
          termNumber: number,
          name: name ?? `Term ${number}`,
          isActive: row.is_active === null || row.is_active === undefined ? true : Number(row.is_active) === 1,
          totalCredits: credits,
          createdAt: istNaiveToUtcIso(str(row.created_at)),
          updatedAt: istNaiveToUtcIso(str(row.updated_at)),
        },
        row,
      ),
    );
  }
  c.stat("semester").planned = terms.length;

  // ---------------------------------------------------------- lecture halls
  c.stat("lecture_hall", t.lecture_hall.length);
  const halls: Planned<HallData>[] = [];
  const hallNames = new Set<string>();
  for (const row of t.lecture_hall) {
    const name = str(row.name);
    const reasons = junkReasonsFor({
      names: [name],
      isDeleted: row.is_deleted,
    });
    if (reasons.length) {
      c.reject("lecture_hall", row, reasons[0] as Reason);
      continue;
    }
    const capacity = toIntRoundHalfUp(row.capacity, rounding);
    if (!name || name.length > 255 || capacity === null || capacity < 1 || capacity > 5000) {
      c.reject("lecture_hall", row, "INVALID_VALUE");
      continue;
    }
    const roomType = mapRoomType(row.room_type);
    if (!roomType) {
      c.reject("lecture_hall", row, "UNKNOWN_ENUM");
      continue;
    }
    if (hallNames.has(lower(name))) {
      c.reject("lecture_hall", row, "DUPLICATE_NAME");
      continue;
    }
    hallNames.add(lower(name));
    const dept = deptByLegacy.get(String(row.dept_id));
    if (row.dept_id && Number(row.dept_id) !== 0 && !dept) notes.hallDepartmentUnmapped += 1;
    halls.push(
      item(
        "lecture_hall",
        idOf(row),
        "lecture_halls",
        {
          departmentId: dept?.newId ?? null,
          name,
          capacity,
          description: str(row.description)?.slice(0, 255) ?? null,
          roomType,
          createdAt: istNaiveToUtcIso(str(row.created_at)),
          updatedAt: istNaiveToUtcIso(str(row.updated_at)),
        },
        row,
      ),
    );
  }
  c.stat("lecture_hall").planned = halls.length;

  // ------------------------------------------------------------------ people
  type Candidate = {
    kind: "learner" | "faculty" | "recruiter";
    row: Row;
    name: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
    /** Set for people that are not loaded in this stage (masked outcome label). */
    status?: string;
  };
  const candidates: Candidate[] = [];
  /** Everybody in scope, loaded or not: used only for the masked review list. */
  const everyone: Candidate[] = [];
  const profileStats: ProfileBuildStats = { droppedItems: 0, droppedFields: 0 };
  const qualificationsByLearner = new Map<string, Row[]>();
  for (const q of t.qualification) {
    if (q.is_deleted === 1) continue;
    const list = qualificationsByLearner.get(String(q.learner_id)) ?? [];
    list.push(q);
    qualificationsByLearner.set(String(q.learner_id), list);
  }
  c.stat("qualification", t.qualification.length).planned = 0;

  const screenPerson = (kind: "learner" | "faculty" | "recruiter", row: Row): Candidate | null => {
    const name = fullName(row.first_name, row.last_name);
    const email = normalizeEmail(row.contact_mail);
    const reasons: JunkReason[] = junkReasonsFor({
      names: [row.first_name as string, row.last_name as string, name, str(row.designation)],
      email: str(row.contact_mail),
      isDeleted: row.is_deleted,
    });
    const phone = normalizePhoneE164(row.contact_mobile);
    const base = {
      kind,
      row,
      name,
      phone,
      email,
      createdAt: str(row.created_at) ?? "9999-12-31 00:00:00",
    };
    if (reasons.length) {
      c.reject(kind, row, reasons[0] as Reason);
      everyone.push({ ...base, status: `REJECTED:${reasons[0]}` });
      return null;
    }
    if (!phone && str(row.contact_mobile)) notes.invalidPhoneDropped += 1;
    if (str(row.contact_mail) && !email) notes.invalidEmailDropped += 1;
    if (!phone && !email) {
      const reason = str(row.contact_mobile) ? "INVALID_PHONE_NO_EMAIL" : "NO_CONTACT";
      c.reject(kind, row, reason);
      everyone.push({ ...base, status: `REJECTED:${reason}` });
      return null;
    }
    const cand: Candidate = base;
    everyone.push(cand);
    return cand;
  };

  c.stat("learner", t.learner.length);
  c.stat("faculty", t.faculty.length);
  c.stat("recruiter", t.recruiter.length);
  for (const row of t.learner) {
    const cand = screenPerson("learner", row);
    if (cand) candidates.push(cand);
  }
  for (const row of t.faculty) {
    const cand = screenPerson("faculty", row);
    if (cand) candidates.push(cand);
  }

  // Recruiters: screened with the same rules (their company is screened too);
  // accepted ones need placement companies/grants, which belong to stage 2b.
  const companyById = new Map<string, Row>();
  for (const row of t.company) companyById.set(idOf(row), row);
  const industryById = new Map<string, Row>();
  for (const row of t.industry_company) industryById.set(idOf(row), row);
  for (const row of t.recruiter) {
    const company = companyById.get(String(row.company_id));
    const industry = industryById.get(String(row.industry_company_id));
    const reasons: JunkReason[] = junkReasonsFor({
      names: [
        row.first_name as string,
        row.last_name as string,
        fullName(row.first_name, row.last_name),
        str(row.designation),
        company ? str(company.name) : null,
        industry ? str(industry.name) : null,
      ],
      email: str(row.contact_mail),
      isDeleted: row.is_deleted,
    });
    const rcand: Candidate = {
      kind: "recruiter",
      row,
      name: fullName(row.first_name, row.last_name),
      phone: normalizePhoneE164(row.contact_mobile),
      email: normalizeEmail(row.contact_mail),
      createdAt: str(row.created_at) ?? "9999-12-31 00:00:00",
    };
    if (reasons.length) {
      c.reject("recruiter", row, reasons[0] as Reason);
      everyone.push({ ...rcand, status: `REJECTED:${reasons[0]}` });
    } else {
      c.defer("recruiter", row, "COMPANY_AND_GRANT_LOAD_IN_2B");
      everyone.push({ ...rcand, status: "DEFERRED_2B" });
    }
  }

  // Deterministic order: oldest account first, faculty before learner on ties.
  candidates.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === "faculty" ? -1 : 1;
    return Number(a.row.id) - Number(b.row.id);
  });

  everyone.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    return Number(a.row.id) - Number(b.row.id);
  });
  // Review list: connected groups sharing a phone or an e-mail (masked),
  // over EVERY account in scope so the owner also sees pairs where one side
  // was rejected as test data.
  const parent = everyone.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const phoneOwner = new Map<string, number>();
  const emailOwner = new Map<string, number>();
  const unite = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  everyone.forEach((cand, i) => {
    if (cand.phone) {
      const other = phoneOwner.get(cand.phone);
      if (other !== undefined) unite(i, other);
      else phoneOwner.set(cand.phone, i);
    }
    if (cand.email) {
      const other = emailOwner.get(cand.email);
      if (other !== undefined) unite(i, other);
      else emailOwner.set(cand.email, i);
    }
  });
  const groups = new Map<number, number[]>();
  everyone.forEach((_, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), i]);
  });

  // Load or block, strictly in order: a person is blocked only when their
  // phone or e-mail is already held by a person that WILL be loaded.
  const loadedPhone = new Map<string, string>();
  const loadedEmail = new Map<string, string>();
  const reviewGroupOf = new Map<Candidate, number>();
  let groupCounter = 0;
  const review: ReviewGroup[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    groupCounter += 1;
    const basis = new Set<"PHONE" | "EMAIL">();
    const phones = new Map<string, number>();
    const emails = new Map<string, number>();
    for (const i of members) {
      const cand = everyone[i];
      if (cand.phone) phones.set(cand.phone, (phones.get(cand.phone) ?? 0) + 1);
      if (cand.email) emails.set(cand.email, (emails.get(cand.email) ?? 0) + 1);
    }
    if ([...phones.values()].some((n) => n > 1)) basis.add("PHONE");
    if ([...emails.values()].some((n) => n > 1)) basis.add("EMAIL");
    members.forEach((i) => reviewGroupOf.set(everyone[i], groupCounter));
    review.push({ group: groupCounter, basis: [...basis], members: [] });
  }

  const people: Planned<PersonData>[] = [];
  const external = options.externalConflicts;
  const outcomes = new Map<Candidate, string>();
  candidates.forEach((cand) => {
    const entity = cand.kind as "learner" | "faculty";
    const claimed =
      (cand.phone && loadedPhone.has(cand.phone)) || (cand.email && loadedEmail.has(cand.email));
    if (claimed) {
      c.blocked.push({
        entity,
        legacyId: idOf(cand.row),
        reason: "BLOCKED_DUPLICATE",
        group: reviewGroupOf.get(cand) ?? null,
      });
      c.stat(entity).blockedDuplicate += 1;
      outcomes.set(cand, "BLOCKED_DUPLICATE");
      return;
    }
    if (
      external &&
      ((cand.phone && external.phones.has(cand.phone)) || (cand.email && external.emails.has(cand.email)))
    ) {
      c.blocked.push({ entity, legacyId: idOf(cand.row), reason: "BLOCKED_DUPLICATE_EXISTING", group: null });
      c.stat(entity).blockedDuplicate += 1;
      outcomes.set(cand, "BLOCKED_DUPLICATE_EXISTING");
      return;
    }
    if (cand.phone) loadedPhone.set(cand.phone, idOf(cand.row));
    if (cand.email) loadedEmail.set(cand.email, idOf(cand.row));
    outcomes.set(cand, "LOADED");

    const row = cand.row;
    const lid = idOf(row);
    const suspended = str(row.suspended_at) !== null;
    const base = {
      identityUid: `legacy:${entity}:${lid}`,
      phoneE164: cand.phone,
      email: cand.email,
      displayName: cand.name,
      createdAt: istNaiveToUtcIso(str(row.created_at)),
      updatedAt: istNaiveToUtcIso(str(row.updated_at)),
      membershipId: nsritId("college_memberships", entity, lid),
      membershipStatus: suspended ? ("SUSPENDED" as const) : ("ACTIVE" as const),
      suspendedAt: suspended ? istNaiveToUtcIso(str(row.suspended_at)) : null,
      suspensionReason: suspended ? str(row.suspension_reason) : null,
    };

    let data: PersonData;
    if (entity === "learner") {
      const quals = qualificationsByLearner.get(lid) ?? [];
      c.stat("qualification").planned += quals.length;
      const rawDocument = buildLearnerProfileDocument(row, quals, profileStats);
      const parsed = learnerProfileDocumentSchema.safeParse(rawDocument);
      let document: Record<string, unknown>;
      if (parsed.success) {
        document = parsed.data as Record<string, unknown>;
      } else {
        const repaired: Record<string, unknown> = { ...rawDocument };
        const empty = emptyLearnerProfileDocument as Record<string, unknown>;
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key in empty && repaired[key] !== empty[key]) {
            repaired[key] = empty[key];
            notes.profileSectionsReset += 1;
          }
        }
        const retry = learnerProfileDocumentSchema.safeParse(repaired);
        document = retry.success
          ? (retry.data as Record<string, unknown>)
          : (emptyLearnerProfileDocument as Record<string, unknown>);
      }
      const section = sectionByLegacy.get(String(row.class_id));
      let enrollment: PersonData["enrollment"] = null;
      if (section) {
        const cohort = [...cohortByLegacy.values()].find((x) => x.newId === section.data.cohortId)!;
        enrollment = {
          enrollmentId: nsritId("learner_program_enrollments", "learner", lid),
          sectionEnrollmentId: nsritId("section_enrollments", "learner", lid),
          programId: cohort.data.programId,
          cohortId: cohort.newId,
          sectionId: section.newId,
          academicPeriodId: section.data.academicPeriodId,
          admittedAt: base.createdAt,
        };
      } else {
        notes.learnersWithoutEnrollment += 1;
      }
      data = {
        ...base,
        personType: "learner",
        roles: ["LEARNER"],
        learner: {
          rollNumber: str(row.roll_number)?.slice(0, 128) ?? null,
          registrationNumber: str(row.unique_id)?.slice(0, 128) ?? null,
          document,
        },
        faculty: null,
        enrollment,
      };
    } else {
      const mapping = mapFacultyType(row.faculty_type);
      if (!mapping.typeName) notes.facultyTypeUnknown += 1;
      const dept = deptByLegacy.get(String(row.dept_id));
      if (row.dept_id && !dept) notes.facultyDepartmentUnmapped += 1;
      data = {
        ...base,
        personType: "faculty",
        roles: mapping.roles,
        learner: null,
        faculty: {
          primaryDepartmentId: dept?.newId ?? null,
          employmentType: mapping.employmentType,
          academicTitle: mapping.academicTitle,
        },
        enrollment: null,
      };
    }
    const planned = item(entity, lid, "users", data, row);
    people.push(planned);
    c.stat(entity).planned += 1;
  });
  notes.profileItemsDropped = profileStats.droppedItems;
  notes.profileFieldsDropped = profileStats.droppedFields;
  notes.roundedToInteger = rounding.rounded;

  for (const group of review) {
    const members: ReviewGroup["members"] = [];
    everyone.forEach((cand) => {
      if (reviewGroupOf.get(cand) !== group.group) return;
      members.push({
        ref: maskLegacyRef(cand.kind, idOf(cand.row)),
        kind: cand.kind,
        name: maskName(cand.name),
        phone: maskPhone(cand.phone),
        email: maskEmail(cand.email),
        outcome: cand.status ?? outcomes.get(cand) ?? "?",
      });
    });
    group.members = members;
  }

  return {
    organization,
    college,
    departments,
    programs,
    periods,
    cohorts,
    sections,
    terms,
    halls,
    people,
    stats: c.stats,
    rejections: c.rejections,
    deferred: c.deferred,
    blocked: c.blocked,
    review,
    notes,
  };
}
