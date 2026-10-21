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
  })
  .strict()
  .default({
    linkedIn: "",
    github: "",
    portfolio: "",
    twitter: "",
    googleScholar: "",
    researchGate: "",
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
    language: requiredText(120),
    proficiency: text(64),
  })
  .strict();

const skillSchema = z
  .object({
    id: z.string().uuid(),
    skill: requiredText(120),
    proficiency: text(64),
  })
  .strict();

const educationSchema = z
  .object({
    id: z.string().uuid(),
    educationType: text(100),
    program: text(100),
    specialization: text(100),
    institutionName: requiredText(300),
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
    name: requiredText(300),
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
    organization: requiredText(200),
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
    title: requiredText(300),
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
      .object({ description: text(5000) })
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
  const contact = record.contact;
  if (contact && typeof contact === "object" && !Array.isArray(contact)) {
    const values = contact as Record<string, unknown>;
    if (values.contactPhone && !values.contactMobile) issues.push("Alternate contact requires primary mobile");
    if (values.contactPhone && values.contactPhone === values.contactMobile) issues.push("Duplicate primary and alternate mobile");
  }
  return issues;
}
