import { z } from "zod";

const text = (max: number) =>
  z.string().trim().max(max).default("");

const requiredText = (max: number) =>
  z.string().trim().min(1).max(max);

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a valid http or https URL")
  .default("");

const calendarDate = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + "T00:00:00Z");
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Use YYYY-MM-DD")
  .default("");

const year = z
  .string()
  .trim()
  .regex(/^$|^\d{4}$/)
  .default("");

const receiptId = z.string().uuid().nullable().default(null);

const contactSchema = z
  .object({
    contactMobile: z
      .string()
      .trim()
      .regex(/^$|^\d{10}$/, "Mobile number must be exactly 10 digits")
      .default(""),
    contactPhone: z
      .string()
      .trim()
      .regex(/^$|^\d{10,15}$/, "Phone number must be 10-15 digits")
      .default(""),
    contactMail: z
      .string()
      .trim()
      .max(320)
      .refine(
        (value) => !value || z.string().email().safeParse(value).success,
        "Enter a valid email address",
      )
      .default(""),
  })
  .strict()
  .default({
    contactMobile: "",
    contactPhone: "",
    contactMail: "",
  });

/** Validate contact edits strictly while preserving older empty contacts on read. */
export const facultyContactEditSchema = contactSchema.superRefine((value, ctx) => {
  if (!value.contactMobile) ctx.addIssue({
    code: "custom", path: ["contactMobile"], message: "Primary mobile number is required",
  });
  if (value.contactPhone && !value.contactMobile) ctx.addIssue({
    code: "custom", path: ["contactMobile"],
    message: "Primary mobile number is required when an alternate number is provided",
  });
  if (value.contactPhone && value.contactPhone === value.contactMobile) ctx.addIssue({
    code: "custom", path: ["contactPhone"],
    message: "Alternate mobile number must differ from primary mobile number",
  });
});

const addressSchema = z
  .object({
    currentAddress: text(2000),
    permanentAddress: text(2000),
    city: text(160),
    state: text(160),
    pincode: text(16),
    currentCity: text(160),
    currentState: text(160),
    currentPincode: text(16),
    permanentCity: text(160),
    permanentState: text(160),
    permanentPincode: text(16),
  })
  .strict()
  .default({
    currentAddress: "",
    permanentAddress: "",
    city: "",
    state: "",
    pincode: "",
    currentCity: "",
    currentState: "",
    currentPincode: "",
    permanentCity: "",
    permanentState: "",
    permanentPincode: "",
  });

const socialSchema = z
  .object({
    linkedIn: httpUrl,
    github: httpUrl,
    portfolio: httpUrl,
    twitter: httpUrl,
    googleScholar: httpUrl,
    researchGate: httpUrl,
    codingProfiles: z.record(z.string().trim().min(1).max(120), httpUrl).default({}),
    codingProfileLinks: z.array(httpUrl).default([]),
  })
  .strict()
  .default({
    linkedIn: "",
    github: "",
    portfolio: "",
    twitter: "",
    googleScholar: "",
    researchGate: "",
    codingProfiles: {},
    codingProfileLinks: [],
  });

const personalDetailsSchema = z
  .object({
    gender: text(64),
    dateOfBirth: calendarDate,
    bloodGroup: text(16),
  })
  .strict()
  .default({
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
  });

const languageSchema = z
  .object({
    id: z.string().uuid(),
    // Legacy rows can be untitled; the editor may repair them without deleting history.
    language: text(120),
    proficiency: text(64),
  })
  .strict();

const skillSchema = z
  .object({
    id: z.string().uuid(),
    skill: text(120),
    proficiency: text(64),
  })
  .strict();

const educationSchema = z
  .object({
    id: z.string().uuid(),
    educationType: text(100),
    program: text(100),
    specialization: text(100),
    institutionName: text(300),
    startYear: year,
    endYear: year,
    isCurrentlyPursuing: z.boolean().default(false),
    gradingType: text(100),
    grade: text(100),
    maxGrade: text(100),
    isRecentEducation: z.boolean().default(false),
    qualifyingExam: text(100),
    examRank: text(200),
    examDetails: z
      .record(
        z.string().max(120),
        z.union([
          z.string().max(1000),
          z.number().finite(),
          z.boolean(),
          z.null(),
        ]),
      )
      .default({}),
    degree: text(100),
    field: text(100),
    score: text(100),
    description: text(2000),
    certificateDocumentId: receiptId,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startYear && value.endYear && Number(value.endYear) < Number(value.startYear)) {
      ctx.addIssue({ code: "custom", path: ["endYear"], message: "Graduation year cannot precede start year" });
    }
    if (value.isCurrentlyPursuing && value.endYear) {
      ctx.addIssue({ code: "custom", path: ["endYear"], message: "Current education cannot have a completed end year" });
    }
  });

const certificationSchema = z
  .object({
    id: z.string().uuid(),
    authority: text(300),
    name: text(300),
    certificationDate: calendarDate,
    validityDate: calendarDate,
    certificateLink: httpUrl,
    certificateDocumentId: receiptId,
    description: text(3000),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.certificationDate && value.validityDate && value.validityDate < value.certificationDate) {
      ctx.addIssue({ code: "custom", path: ["validityDate"], message: "Validity cannot precede certification date" });
    }
  });

const experienceSchema = z
  .object({
    id: z.string().uuid(),
    organization: text(200),
    designation: text(200),
    description: text(2000),
    from: calendarDate,
    to: calendarDate,
    experienceType: text(100),
    location: text(200),
    experienceCertificateDocumentId: receiptId,
    offerLetterDocumentId: receiptId,
    isPaid: z.boolean().default(false),
    salary: text(100),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.to < value.from) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "End date cannot be before start date",
      });
    }
  });

const publicationSchema = z
  .object({
    id: z.string().uuid(),
    title: text(300),
    journal: text(300),
    year,
    doi: text(240),
    link: httpUrl,
    authors: text(2000),
    description: text(5000),
  })
  .strict();

const awardSchema = z
  .object({
    id: z.string().uuid(),
    title: requiredText(300),
    year,
    description: text(3000),
    awardedBy: text(300),
  })
  .strict();

const metadataScalar = z.union([
  z.string().max(5000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

/**
 * Safe persisted Faculty profile document.
 *
 * Deliberate security redesign:
 * - raw Aadhaar/PAN numbers are NOT allowed in this JSON document;
 * - uploaded files are referenced by private receipt IDs, never object URLs;
 * - Faculty has publications/awards but no Resume section (legacy Faculty UI
 *   explicitly guards Resume as learner-only).
 *
 * Canonical identity names, college membership, department, employment type
 * and academic title stay in normalized platform/profile columns rather than
 * being duplicated here.
 */
export const facultyProfileDocumentSchema = z
  .object({
    about: z
      .object({ description: text(100000) })
      .strict()
      .default({ description: "" }),
    personalDetails: personalDetailsSchema,
    contact: contactSchema,
    address: addressSchema,
    socialProfiles: socialSchema,
    languages: z.array(languageSchema).default([]),
    education: z.array(educationSchema).default([]),
    certifications: z.array(certificationSchema).default([]),
    experiences: z.array(experienceSchema).default([]),
    skills: z.array(skillSchema).default([]),
    publications: z.array(publicationSchema).default([]),
    awards: z.array(awardSchema).default([]),
    /** Historical organization affiliations are not thrown away during a profile edit. */
    organizations: z.array(z.record(z.string().trim().min(1).max(120), metadataScalar)).default([]),
    metadata: z
      .record(z.string().trim().min(1).max(120), metadataScalar)
      .default({}),
    profileImageDocumentId: receiptId,
    identitySummary: z
      .object({
        aadhaarLast4: z
          .string()
          .regex(/^$|^\d{4}$/)
          .default(""),
        panMasked: z.string().trim().max(10).default(""),
        aadhaarDocumentId: receiptId,
        panDocumentId: receiptId,
      })
      .strict()
      .default({
        aadhaarLast4: "",
        panMasked: "",
        aadhaarDocumentId: null,
        panDocumentId: null,
      }),
  })
  .strict()
  .superRefine((profile, ctx) => {
    const collections = ["languages", "education", "certifications", "experiences", "skills", "publications", "awards"] as const;
    for (const section of collections) {
      const seen = new Set<string>();
      for (const [index, entry] of profile[section].entries()) {
        if (seen.has(entry.id)) {
          ctx.addIssue({ code: "custom", path: [section, index, "id"], message: "Duplicate profile record ID" });
        }
        seen.add(entry.id);
      }
    }
  });

export const emptyFacultyProfileDocument =
  facultyProfileDocumentSchema.parse({});

export type FacultyProfileDocument = z.infer<
  typeof facultyProfileDocumentSchema
>;

/** A legacy photo URL is an import hint, not an authorized public read grant.
 * New documents persist only verified, owner-bound private receipt IDs.
 */
export const legacyFacultyProfileImageUrlSchema = z.string().trim().max(1024)
  .refine(value => !value || /^https:\/\//i.test(value),
    "Profile image URL must use HTTPS.");

/** Non-identifying pre-migration exceptions. Never truncate historic lists. */
export function facultyLegacyProfileExceptions(raw: unknown): string[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return ["Invalid legacy profile shape"];
  const record = raw as Record<string, unknown>;
  const oldLimits: Record<string, number> = {
    languages: 30, education: 30, certifications: 50, experiences: 50,
    skills: 100, publications: 100, awards: 100,
  };
  const issues: string[] = [];
  for (const [name, oldLimit] of Object.entries(oldLimits)) {
    const value = record[name];
    if (Array.isArray(value) && value.length > oldLimit) {
      issues.push(name + ": " + value.length + " rows require no-truncation migration review");
    }
  }
  const contact = record.contact && typeof record.contact === "object" &&
    !Array.isArray(record.contact)
    ? record.contact as Record<string, unknown> : record;
  const primary = typeof contact.contactMobile === "string" ? contact.contactMobile.trim() : "";
  const alternate = typeof contact.contactPhone === "string" ? contact.contactPhone.trim() : "";
  const email = typeof contact.contactMail === "string" ? contact.contactMail.trim() : "";
  if (alternate && !primary) issues.push("Alternate contact requires primary mobile");
  if (alternate && alternate === primary) issues.push("Duplicate primary and alternate mobile");
  if (primary && !/^\\d{10}$/.test(primary)) issues.push("Primary mobile must have 10 digits");
  if (alternate && !/^\\d{10,15}$/.test(alternate)) issues.push("Alternate mobile must have 10 to 15 digits");
  if (email && !z.email().safeParse(email).success) issues.push("Invalid contact email");
  const photo = record.profileImageUrl ?? record.profileImage;
  if (typeof photo === "string" && !legacyFacultyProfileImageUrlSchema.safeParse(photo).success) {
    issues.push("Profile image URL must use HTTPS.");
  }
  // Sensitive legacy document URLs require a fresh private upload and an
  // authorized, membership-bound receipt. Never copy raw refs into JSON.
  if (record.identityDocuments != null || record.aadhaarNumber != null ||
      record.panNumber != null) issues.push("Private identity evidence requires secure re-verification");
  return issues;
}

/**
 * Adapt the legacy faculty JSON for a one-time, audited import. This deliberately
 * does not interpret a URL as proof of file ownership; attachments are migrated
 * separately through private, membership-bound receipt issuance.
 * The caller must persist the result before relying on generated row IDs.
 */
export function importLegacyFacultyProfileDocument(raw: unknown): {
  document: FacultyProfileDocument | null;
  warnings: string[];
} {
  const warnings = facultyLegacyProfileExceptions(raw);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { document: null, warnings };
  }
  const source = raw as Record<string, unknown>;
  const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown> : {};
  const string = (value: unknown): string =>
    typeof value === "string" ? value.trim() : value == null ? "" : String(value);
  const date = (value: unknown): string => {
    const candidate = string(value);
    if (!candidate) return "";
    const iso = candidate.match(/^(\\d{4}-\\d{2}-\\d{2})(?:T.*)?$/);
    if (iso) return iso[1];
    const indian = candidate.match(/^(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})$/);
    if (indian) return indian[3] + "-" + indian[2].padStart(2, "0") + "-" + indian[1].padStart(2, "0");
    warnings.push("Historical date format needs review before import");
    return candidate;
  };
  // A deterministic UUID per position preserves duplicate-looking records and
  // preserves sequence on a repeatable import; it contains no embedded PII.
  const stableId = (section: string, index: number): string => {
    const seed = section + ":" + index;
    const pieces = [2166136261, 2166136261 ^ 0x9e3779b9, 2166136261 ^ 0x85ebca6b, 2166136261 ^ 0xc2b2ae35];
    for (let p = 0; p < pieces.length; p++) {
      for (const ch of seed) pieces[p] = Math.imul(pieces[p] ^ (ch.charCodeAt(0) + p), 16777619) >>> 0;
    }
    const hex = pieces.map(v => v.toString(16).padStart(8, "0")).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-4" + hex.slice(13, 16) +
      "-8" + hex.slice(17, 20) + "-" + hex.slice(20, 32);
  };
  const fields: Record<string, readonly string[]> = {
    languages: ["language", "proficiency"], skills: ["skill", "proficiency"],
    education: ["educationType", "program", "specialization", "institutionName", "startYear", "endYear",
      "isCurrentlyPursuing", "gradingType", "grade", "maxGrade", "isRecentEducation", "qualifyingExam",
      "examRank", "examDetails", "degree", "field", "score", "description"],
    certifications: ["authority", "name", "certificationDate", "validityDate", "certificateLink", "description"],
    experiences: ["organization", "designation", "description", "from", "to", "experienceType",
      "location", "isPaid", "salary"],
    publications: ["title", "journal", "year", "doi", "link", "authors", "description"],
    awards: ["title", "year", "description", "awardedBy"],
  };
  const list = (section: keyof typeof fields, legacySection = section): Record<string, unknown>[] => {
    const records = source[section] ?? source[legacySection];
    if (records == null) return [];
    if (!Array.isArray(records)) { warnings.push(section + ": expected a list"); return []; }
    return records.map((item, index) => {
      const row = object(item);
      const id = typeof row.id === "string" && z.string().uuid().safeParse(row.id).success
        ? row.id : stableId(section, index);
      const mapped: Record<string, unknown> = { id };
      for (const key of fields[section]) {
        if (row[key] !== undefined) mapped[key] = row[key];
      }
      for (const key of ["certificationDate", "validityDate", "from", "to"]) {
        if (mapped[key] !== undefined) mapped[key] = date(mapped[key]);
      }
      if (section === "education") {
        if (row.certificateUpload) warnings.push("education " + (index + 1) + ": re-verify private certificate");
      }
      if (section === "certifications" && row.certificateUpload) warnings.push("certification " + (index + 1) + ": re-verify private certificate");
      if (section === "experiences" && (row.internshipCertificateUpload || row.offerLetterUpload))
        warnings.push("experience " + (index + 1) + ": re-verify private attachments");
      return mapped;
    });
  };
  const sourcePersonal = object(source.personalDetails);
  const sourceContact = object(source.contact);
  const sourceAddress = object(source.address);
  const sourceSocial = object(source.socialProfiles);
  const social: Record<string, unknown> = {};
  for (const field of ["linkedIn", "github", "portfolio", "twitter", "googleScholar", "researchGate"]) {
    social[field] = sourceSocial[field] ?? source[field] ?? "";
  }
  social.codingProfiles = sourceSocial.codingProfiles ?? source.codingProfiles ?? {};
  social.codingProfileLinks = sourceSocial.codingProfileLinks ?? source.codingProfileLinks ?? [];
  const address: Record<string, unknown> = {};
  for (const field of ["currentAddress", "permanentAddress", "city", "state", "pincode",
    "currentCity", "currentState", "currentPincode", "permanentCity", "permanentState", "permanentPincode"]) {
    address[field] = sourceAddress[field] ?? source[field] ?? "";
  }
  const canonical = {
    about: { description: source.about && typeof source.about === "object"
      ? string(object(source.about).description) : string(source.description ?? source.about) },
    personalDetails: {
      gender: sourcePersonal.gender ?? source.gender ?? "",
      dateOfBirth: date(sourcePersonal.dateOfBirth ?? sourcePersonal.dob ?? source.dateOfBirth ?? source.dob),
      bloodGroup: sourcePersonal.bloodGroup ?? source.bloodGroup ?? "",
    },
    contact: {
      contactMobile: sourceContact.contactMobile ?? source.contactMobile ?? "",
      contactPhone: sourceContact.contactPhone ?? source.contactPhone ?? "",
      contactMail: sourceContact.contactMail ?? source.contactMail ?? "",
    },
    address, socialProfiles: social,
    languages: list("languages"), skills: list("skills"),
    education: list("education", "qualifications"), certifications: list("certifications"),
    experiences: list("experiences"), publications: list("publications"), awards: list("awards"),
    organizations: source.organizations ?? [],
    metadata: source.metadata ?? {},
  };
  const parsed = facultyProfileDocumentSchema.safeParse(canonical);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      warnings.push("Import requires correction at " + issue.path.join(".") + ": " + issue.message);
    }
    return { document: null, warnings };
  }
  if (source.profileImage || source.profileImageUrl || source.website)
    warnings.push("Profile image needs a verified private upload receipt");
  return { document: parsed.data, warnings };
}

/** The normalized roster remains authoritative for employee number, faculty type,
 * academic role, and department; do not duplicate membership identity into JSON. */
export function legacyFacultyHeaderHints(raw: unknown): {
  employeeId: string; department: string; facultyType: string;
} {
  const value = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  const str = (key: string) => typeof value[key] === "string" ? (value[key] as string).trim() : "";
  return { employeeId: str("uniqueId") || str("employeeId"),
    department: str("department") || str("deptId"),
    facultyType: str("facultyType") };
}
