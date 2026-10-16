/**
 * Pure value mappers for the NSRIT import (stage 2a). Synthetic-data unit
 * tests live in tests/unit/nsrit-migration-*.test.ts.
 */
import { isRecord, nsritId, roundHalfUp } from "./common";

export type Row = Record<string, unknown>;

export function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function fullName(first: unknown, last: unknown): string | null {
  const text = [str(first), str(last)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  return text === "" ? null : text;
}

/** E.164 for Indian numbers (+91 and the last 10 digits). Null when unusable. */
export function normalizePhoneE164(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  let national: string | null = null;
  if (digits.length === 10) national = digits;
  else if (digits.length === 11 && digits.startsWith("0"))
    national = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("91"))
    national = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith("091"))
    national = digits.slice(3);
  if (!national || !/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

const EMAIL_SHAPE =
  /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

/** Lower-cased, trimmed e-mail or null when not a plausible address. */
export function normalizeEmail(value: unknown): string | null {
  const text = str(value)?.toLowerCase() ?? null;
  if (!text || text.length > 254 || !EMAIL_SHAPE.test(text)) return null;
  return text;
}

// ------------------------------------------------------------- faculty type

export const FACULTY_TYPE_NAMES = [
  "PERMANENT",
  "GUEST",
  "VISITING",
  "CONTRACT",
  "ADMIN",
  "HEAD",
  "COORDINATOR",
  "CLERK",
  "PROFESSOR",
  "ASSOCIATE_PROFESSOR",
  "ASSISTANT_PROFESSOR",
  "LECTURER",
  "ADJUNCT",
  "MENTOR",
  "TPO",
] as const;

export type FacultyTypeName = (typeof FACULTY_TYPE_NAMES)[number];
export type MembershipRoleName =
  | "LEARNER"
  | "FACULTY"
  | "COLLEGE_ADMIN"
  | "MENTOR"
  | "TPO";

export type FacultyMapping = {
  typeName: FacultyTypeName | null;
  roles: MembershipRoleName[];
  employmentType: string | null;
  academicTitle: string | null;
};

const EMPLOYMENT_LABEL: Partial<Record<FacultyTypeName, string>> = {
  PERMANENT: "Permanent",
  GUEST: "Guest",
  VISITING: "Visiting",
  CONTRACT: "Contract",
  ADJUNCT: "Adjunct",
};
const TITLE_LABEL: Partial<Record<FacultyTypeName, string>> = {
  HEAD: "Head",
  COORDINATOR: "Coordinator",
  CLERK: "Clerk",
  PROFESSOR: "Professor",
  ASSOCIATE_PROFESSOR: "Associate Professor",
  ASSISTANT_PROFESSOR: "Assistant Professor",
  LECTURER: "Lecturer",
};

/**
 * faculty.faculty_type stores the legacy enum ORDINAL. Owner mapping:
 * ADMIN -> COLLEGE_ADMIN, MENTOR -> MENTOR, TPO -> TPO (each with the FACULTY
 * base role, as the plan specifies); the rest by employment type or title.
 * NULL or unknown ordinals load as plain FACULTY and are counted by callers.
 */
export function mapFacultyType(ordinal: unknown): FacultyMapping {
  const n = typeof ordinal === "number" ? ordinal : Number(ordinal);
  const typeName =
    ordinal !== null &&
    ordinal !== undefined &&
    String(ordinal) !== "" &&
    Number.isInteger(n)
      ? (FACULTY_TYPE_NAMES[n] ?? null)
      : null;
  const roles: MembershipRoleName[] = ["FACULTY"];
  if (typeName === "ADMIN") roles.push("COLLEGE_ADMIN");
  if (typeName === "MENTOR") roles.push("MENTOR");
  if (typeName === "TPO") roles.push("TPO");
  return {
    typeName,
    roles,
    employmentType: typeName ? (EMPLOYMENT_LABEL[typeName] ?? null) : null,
    academicTitle: typeName ? (TITLE_LABEL[typeName] ?? null) : null,
  };
}

// ----------------------------------------------------------- academics enums

export const ROOM_TYPES = [
  "CLASSROOM",
  "LECTURE_HALL",
  "LAB",
  "SEMINAR_HALL",
  "AUDITORIUM",
  "CONFERENCE_ROOM",
] as const;

/** lecture_hall.room_type stores the RoomType ordinal. */
export function mapRoomType(
  ordinal: unknown,
): (typeof ROOM_TYPES)[number] | null {
  const n = Number(ordinal);
  return ordinal !== null && ordinal !== "" && Number.isInteger(n)
    ? (ROOM_TYPES[n] ?? null)
    : null;
}

const COHORT_STATUS_MAP: Record<
  string,
  "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
> = {
  ACTIVE: "ACTIVE",
  UPCOMING: "PLANNED",
  PLANNED: "PLANNED",
  COMPLETED: "COMPLETED",
  GRADUATED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
  INACTIVE: "ARCHIVED",
};

export function mapCohortStatus(value: unknown) {
  return COHORT_STATUS_MAP[String(value ?? "").trim().toUpperCase()] ?? null;
}

/** "2026-27", "2026-2027", "2026/27" -> start year, or null. */
export function parseAcademicYear(value: unknown): number | null {
  const match = /^\s*(\d{4})\s*[-/]\s*(\d{2}|\d{4})\s*$/.exec(
    String(value ?? ""),
  );
  if (!match) return null;
  const start = Number(match[1]);
  const endRaw = match[2];
  const end =
    endRaw.length === 2
      ? Math.floor(start / 100) * 100 + Number(endRaw)
      : Number(endRaw);
  return end === start + 1 ? start : null;
}

export type PeriodSpec = {
  key: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE";
};

/**
 * College academic period for an academic year. The cohort progression
 * trigger treats July as the year boundary, so a year runs 1 July to 30 June.
 * Closed periods reject new cohorts and sections in vNext, so past years load
 * as ACTIVE and only future years as PLANNED (documented fidelity choice).
 */
export function periodForAcademicYear(
  startYear: number,
  today: Date,
): PeriodSpec {
  const startDate = `${startYear}-07-01`;
  const endDate = `${startYear + 1}-06-30`;
  const yy = String((startYear + 1) % 100).padStart(2, "0");
  const name = `${startYear}-${yy}`;
  return {
    key: name,
    code: `AY${name}`,
    name,
    startDate,
    endDate,
    status: today.toISOString().slice(0, 10) < startDate ? "PLANNED" : "ACTIVE",
  };
}

/** Upper-case ASCII code fragment, at most `max` characters. */
export function codeSlug(value: unknown, max = 40): string {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (slug || "X").slice(0, max).replace(/-+$/g, "") || "X";
}

export function uniqueCode(
  prefix: unknown,
  suffix: string | number,
  max = 64,
): string {
  const tail = `-${suffix}`;
  return `${codeSlug(prefix, max - tail.length)}${tail}`;
}

export type Counter = { rounded: number };

/** Round half up to an integer; counts each value that actually changed. */
export function toIntRoundHalfUp(
  value: unknown,
  counter?: Counter,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = roundHalfUp(n);
  if (rounded !== n && counter) counter.rounded += 1;
  return rounded;
}

// -------------------------------------------------------- learner profile doc

const urlOrEmpty = (value: unknown): string => {
  const text = str(value);
  if (!text) return "";
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return "";
    }
    return url.toString().slice(0, 2000);
  } catch {
    return "";
  }
};

const clip = (value: unknown, max: number): string =>
  (str(value) ?? "").slice(0, max);

/** YYYY-MM-DD from ISO, DD/MM/YYYY, DD-MM-YYYY or a datetime; "" otherwise. */
export function parseCalendarDate(value: unknown): string {
  const text = str(value);
  if (!text) return "";
  let y: string;
  let m: string;
  let d: string;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (iso) [, y, m, d] = iso;
  else if (dmy) [, d, m, y] = dmy;
  else return "";
  const out = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const date = new Date(`${out}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== out
    ? ""
    : out;
}

const year4 = (value: unknown): string => {
  const text = str(value);
  return text && /^\d{4}$/.test(text) ? text : "";
};

const PROFICIENCY = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const mapProficiency = (value: unknown): "" | (typeof PROFICIENCY)[number] => {
  const text = (str(value) ?? "").toLowerCase();
  return PROFICIENCY.find((p) => p.toLowerCase() === text) ?? "";
};
const LANGUAGE_LEVEL = ["Beginner", "Intermediate", "Advanced", "Native"] as const;
const mapLanguageLevel = (value: unknown): (typeof LANGUAGE_LEVEL)[number] => {
  const text = (str(value) ?? "").toLowerCase();
  if (text === "fluent" || text === "proficient") return "Advanced";
  return LANGUAGE_LEVEL.find((p) => p.toLowerCase() === text) ?? "Intermediate";
};
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const asRecord = (value: unknown): Row => (isRecord(value) ? value : {});

export type ProfileBuildStats = { droppedItems: number; droppedFields: number };

/**
 * Builds a vNext `learner_profiles.profile_document` from a legacy learner
 * row (plus its qualification rows). The document follows the module's own
 * strict schema so the existing profile pages can read it. Aadhaar/PAN are
 * never copied (owner decision); photos and files are a later stage.
 * Item ids are deterministic so re-runs produce an identical document.
 */
export function buildLearnerProfileDocument(
  learner: Row,
  qualifications: Row[],
  stats: ProfileBuildStats = { droppedItems: 0, droppedFields: 0 },
): Record<string, unknown> {
  const lid = String(learner.id);
  const itemId = (section: string, index: number) =>
    nsritId("learner_profile_item", `learner:${lid}:${section}`, index);
  const drop = () => {
    stats.droppedItems += 1;
  };

  const gender = GENDERS.find(
    (g) => g.toLowerCase() === (str(learner.gender) ?? "").toLowerCase(),
  );
  const blood = BLOOD.find(
    (b) => b === (str(learner.blood_group) ?? "").toUpperCase().replace(/\s+/g, ""),
  );
  const dob = parseCalendarDate(learner.dob);
  if (str(learner.dob) && !dob) stats.droppedFields += 1;

  const permanent = [
    str(learner.permanent_address),
    str(learner.permanent_city),
    str(learner.permanent_state),
    str(learner.permanent_pincode),
  ]
    .filter(Boolean)
    .join(", ");
  const pincode = str(learner.current_pincode) ?? str(learner.pincode) ?? "";
  const phoneAlt = str(learner.contact_phone) ?? "";
  const contactEmail = normalizeEmail(learner.contact_mail) ?? "";

  const education: Row[] = [];
  qualifications.forEach((q, index) => {
    const gradingRaw = (str(q.grading_type) ?? "").toLowerCase();
    const gradingType =
      gradingRaw === "cgpa"
        ? "CGPA"
        : gradingRaw === "percentage"
          ? "Percentage"
          : gradingRaw === "grade"
            ? "Grade"
            : "";
    const examDetails: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(asRecord(q.exam_details))) {
      if (["string", "number", "boolean"].includes(typeof v) && k.length <= 120) {
        examDetails[k] =
          typeof v === "string" ? v.slice(0, 500) : (v as number | boolean);
      }
    }
    education.push({
      id: itemId("education", index),
      educationType: clip(q.education_type, 120),
      program: clip(q.program, 200),
      specialization: clip(q.specialization, 200),
      institution: clip(q.institution_name, 300),
      startYear: year4(q.start_year),
      endYear: year4(q.end_year),
      gradingType,
      gradeObtained: clip(q.grade, 64),
      maxGrade: clip(q.max_grade, 64),
      qualifyingExam: clip(q.qualifying_exam, 120),
      examDetails,
    });
  });

  const skills: Row[] = [];
  asArray(learner.skills).forEach((s, index) => {
    const rec = asRecord(typeof s === "string" ? { skill: s } : s);
    const name = clip(rec.skill ?? rec.name, 120);
    if (!name) return drop();
    skills.push({
      id: itemId("skills", index),
      name,
      proficiency: mapProficiency(rec.proficiency),
    });
  });

  const experiences: Row[] = [];
  asArray(learner.experiences).forEach((e, index) => {
    const rec = asRecord(e);
    const organization = clip(
      rec.organization ?? rec.company ?? rec.companyName ?? rec.organisation,
      240,
    );
    const designation = clip(
      rec.designation ?? rec.role ?? rec.title ?? rec.position,
      200,
    );
    if (!organization || !designation) return drop();
    const typeRaw = (str(rec.experienceType ?? rec.type) ?? "").toLowerCase();
    const types = [
      "Full-time",
      "Part-time",
      "Internship",
      "Contract",
      "Freelance",
      "Other",
    ];
    experiences.push({
      id: itemId("experiences", index),
      organization,
      designation,
      experienceType: types.find((t) => t.toLowerCase() === typeRaw) ?? "Full-time",
      location: clip(rec.location, 200),
      startDate: parseCalendarDate(rec.startDate),
      endDate: parseCalendarDate(rec.endDate),
      currentlyWorking: rec.currentlyWorking === true || rec.isCurrent === true,
      compensation: clip(rec.compensation, 120),
      description: clip(rec.description, 5000),
    });
  });

  const projects: Row[] = [];
  asArray(learner.projects).forEach((p, index) => {
    const rec = asRecord(p);
    const name = clip(rec.name ?? rec.title, 240);
    if (!name) return drop();
    const rawSkills = Array.isArray(rec.skillsUsed)
      ? rec.skillsUsed
      : typeof rec.skillsUsed === "string"
        ? rec.skillsUsed.split(",")
        : [];
    projects.push({
      id: itemId("projects", index),
      name,
      githubUrl: urlOrEmpty(rec.githubUrl),
      projectUrl: urlOrEmpty(rec.liveUrl ?? rec.projectUrl),
      description: clip(rec.description, 5000),
      skills: rawSkills.map((s) => clip(s, 120)).filter(Boolean).slice(0, 50),
    });
  });

  const certifications: Row[] = [];
  asArray(learner.certifications).forEach((c, index) => {
    const rec = asRecord(c);
    const name = clip(rec.name, 240);
    if (!name) return drop();
    certifications.push({
      id: itemId("certifications", index),
      name,
      issuingAuthority: clip(rec.authority ?? rec.issuingAuthority, 240),
      issueDate: parseCalendarDate(rec.certificationDate ?? rec.issueDate),
      expiryDate: parseCalendarDate(rec.validityDate ?? rec.expiryDate),
      credentialUrl: urlOrEmpty(rec.certificateLink ?? rec.credentialUrl),
      description: clip(rec.description, 3000),
    });
  });

  const achievements: Row[] = [];
  asArray(learner.achievements).forEach((a, index) => {
    const rec = asRecord(a);
    const title = clip(rec.title, 240);
    if (!title) return drop();
    achievements.push({
      id: itemId("achievements", index),
      title,
      year: year4(rec.year),
      description: clip(rec.description, 3000),
    });
  });

  const languages: Row[] = [];
  asArray(learner.languages).forEach((l, index) => {
    const rec = asRecord(typeof l === "string" ? { language: l } : l);
    const language = clip(rec.language ?? rec.name, 120);
    if (!language) return drop();
    languages.push({
      id: itemId("languages", index),
      language,
      proficiency: mapLanguageLevel(rec.proficiency),
    });
  });

  const extracurriculars: Row[] = [];
  asArray(learner.extracurricular).forEach((x, index) => {
    const rec = asRecord(x);
    const activity = clip(rec.activity ?? rec.title, 240);
    if (!activity) return drop();
    extracurriculars.push({
      id: itemId("extracurriculars", index),
      activity,
      year: year4(rec.year),
      description: clip(rec.description, 3000),
    });
  });

  const hobbies = asArray(learner.hobbies)
    .map((h) => clip(isRecord(h) ? (h.hobby ?? h.name) : h, 120))
    .filter(Boolean)
    .slice(0, 50);

  return {
    headline: "",
    bio: clip(learner.description, 3000),
    contacts: {
      alternatePhone: /^[+]?\d[\d\s-]{7,20}$/.test(phoneAlt) ? phoneAlt : "",
      contactEmail,
    },
    socialProfiles: {
      linkedinUrl: urlOrEmpty(learner.linkedin),
      githubUrl: urlOrEmpty(learner.github),
      portfolioUrl: urlOrEmpty(learner.portfolio ?? learner.website),
      twitterUrl: urlOrEmpty(learner.twitter),
      googleScholarUrl: "",
      researchGateUrl: "",
    },
    address: {
      currentAddress: clip(
        str(learner.current_address) ?? str(learner.address),
        1000,
      ),
      city: clip(str(learner.current_city) ?? str(learner.city), 160),
      state: clip(str(learner.current_state) ?? str(learner.state), 160),
      pincode: /^[A-Za-z0-9 -]{3,16}$/.test(pincode) ? pincode : "",
      permanentAddress: permanent.slice(0, 1000),
    },
    personalDetails: {
      gender: gender ?? "",
      dateOfBirth: dob,
      bloodGroup: blood ?? "",
    },
    identity: { aadhaarNumber: "", panNumber: "" },
    experiences,
    education,
    skills,
    projects,
    certifications,
    achievements,
    languages,
    extracurriculars,
    hobbies,
    metadata: [],
  };
}
