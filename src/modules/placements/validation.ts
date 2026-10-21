import { z } from "zod";

export const placementCompanyIdSchema = z.string().uuid();
export const placementCompanyRelationshipIdSchema = z.string().uuid();

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "Use an http or https URL");

export const placementCompanyDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^www\./, ""))
  .pipe(
    z
      .string()
      .min(3)
      .max(255)
      .regex(
        /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/,
        "Enter a domain without protocol, path or email prefix",
      )
      .refine((value) => value.includes("."), "Enter a complete domain"),
  );

const corporateWebsiteSchema=z.string().trim().max(500).url().refine(
 value=>{try{const url=new URL(value);return url.protocol==="https:"&&
  !url.username&&!url.password;}catch{return false;}},
 "Company website must be a valid https link",
);
export const createPlacementCompanyInputSchema = z
  .object({
    collegeId: z.string().uuid(),
    name: z.string().trim().min(2,"Company name must be between 2 and 150 characters").max(150,"Company name must be between 2 and 150 characters"),
    websiteUrl: corporateWebsiteSchema.optional(),
    primaryDomain: placementCompanyDomainSchema.optional(),
    isTrusted: z.boolean().optional().default(false),
  })
  .strict()
  .refine(value=>Boolean(value.primaryDomain||value.websiteUrl),{
    path:["primaryDomain"],
    message:"Add the company's website or a company email domain",
  });

export const updatePlacementCompanyRelationshipInputSchema = z
  .object({
    isTrusted: z.boolean().optional(),
    ownerMembershipId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.isTrusted !== undefined ||
      value.ownerMembershipId !== undefined,
    "Provide at least one relationship field",
  );

export type CreatePlacementCompanyInput = z.input<
  typeof createPlacementCompanyInputSchema
>;
export type UpdatePlacementCompanyRelationshipInput = z.infer<
  typeof updatePlacementCompanyRelationshipInputSchema
>;


export const placementRecruiterGrantIdSchema =
  z.string().uuid();

export const placementRecruiterGrantInputSchema =
  z
    .object({
      companyRelationshipId:
        placementCompanyRelationshipIdSchema,
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email()
        .max(320),
      title: z
        .string()
        .trim()
        .min(1)
        .max(160)
        .nullable()
        .optional(),
    })
    .strict();

export type PlacementRecruiterGrantInput =
  z.input<
    typeof placementRecruiterGrantInputSchema
  >;


export const placementEmploymentTypes = [
  "FULL_TIME",
  "INTERNSHIP",
  "CONTRACT",
] as const;

export const placementWorkModes = [
  "ONSITE",
  "HYBRID",
  "REMOTE",
  "NO_PREFERENCE",
] as const;

export const placementShiftPreferences = [
  "DAY",
  "NIGHT",
  "FLEXIBLE",
  "NO_PREFERENCE",
] as const;

export const placementRelocationPreferences = [
  "YES",
  "NO",
  "NO_PREFERENCE",
] as const;

function distinctTextList(
  maxItems: number,
  maxLength: number,
) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(maxLength),
    )
    .max(maxItems)
    .transform((values) => {
      const seen = new Set<string>();
      const result: string[] = [];

      for (const value of values) {
        const key = value.toLocaleLowerCase("en");
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(value);
      }

      return result;
    });
}

export const candidatePreferencesInputSchema = z
  .object({
    preferredRoleTitles: distinctTextList(20, 120)
      .optional()
      .default([]),
    preferredLocations: distinctTextList(20, 120)
      .optional()
      .default([]),
    preferredEmploymentTypes: z
      .array(z.enum(placementEmploymentTypes))
      .max(placementEmploymentTypes.length)
      .transform((values) => [...new Set(values)])
      .optional()
      .default([]),
    preferredWorkMode: z
      .enum(placementWorkModes)
      .optional()
      .default("NO_PREFERENCE"),
    shiftPreference: z
      .enum(placementShiftPreferences)
      .optional()
      .default("NO_PREFERENCE"),
    minimumAnnualCtcInr: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .nullable()
      .optional()
      .default(null),
    relocationPreference: z
      .enum(placementRelocationPreferences)
      .optional()
      .default("NO_PREFERENCE"),
    notifyMatchingJobs: z.boolean().optional().default(true),
    notifyApplicationUpdates: z
      .boolean()
      .optional()
      .default(true),
  })
  .strict();

export type CandidatePreferencesInput = z.input<
  typeof candidatePreferencesInputSchema
>;


export const placementSeasonIdSchema =
  z.string().uuid();

const placementCalendarDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use YYYY-MM-DD",
  )
  .refine((value) => {
    const parsed = new Date(
      value + "T00:00:00Z",
    );
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed
        .toISOString()
        .slice(0, 10) === value
    );
  }, "Use a valid calendar date");

export const createPlacementSeasonInputSchema =
  z
    .object({
      collegeId: z.string().uuid(),
      name: z
        .string()
        .trim()
        .min(2)
        .max(160),
      code: z
        .string()
        .trim()
        .min(2)
        .max(64),
      startDate:
        placementCalendarDateSchema,
      endDate:
        placementCalendarDateSchema,
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        value.endDate < value.startDate
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message:
            "Season end date must be on or after the start date",
        });
      }
    });

export const placementSeasonActionInputSchema =
  z
    .object({
      action: z.literal("CLOSE"),
    })
    .strict();

export type CreatePlacementSeasonInput =
  z.input<
    typeof createPlacementSeasonInputSchema
  >;

export const placementJobIdSchema = z.string().uuid();

export const placementJobStatuses = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
] as const;

export const placementJobApplicationModes = [
  "INTERNAL",
  "HYBRID",
  "EXTERNAL_ONLY",
] as const;

const placementJobWorkModes = [
  "ONSITE",
  "HYBRID",
  "REMOTE",
] as const;

const optionalHttpUrlSchema = httpUrlSchema.nullable().optional();

import {placementLegacyPostingDetailsSchema} from "./placement-legacy-posting-model";

const placementJobFieldsSchema = z
  .object({
    collegeId: z.string().uuid(),
    seasonId: z
      .string()
      .uuid()
      .optional(),
    companyRelationshipId: z.string().uuid(),
    title: z.string().trim().min(3, "At least 3 characters").max(100),
    description: z.string().trim().max(15_000).default(""),
    legacyPostingDetails:placementLegacyPostingDetailsSchema.nullable().optional(),
    employmentType: z.enum(placementEmploymentTypes),
    /** Optional college Job types label, distinct from the normalized employment category. */
    jobTypeLabel: z.string().trim().min(2).max(40).optional(),
    workMode: z.enum(placementJobWorkModes),
    locations: distinctTextList(20, 120).optional().default([]),
    openings: z.number().int().positive().max(100_000).nullable().optional(),
    minimumAnnualCtcInr: z.number().int().min(0).max(100_000_000).nullable().optional(),
    maximumAnnualCtcInr: z.number().int().min(0).max(100_000_000).nullable().optional(),
    /** Persisted dream classification and pay detail on the drive itself. */
    isDream: z.boolean().optional().default(false),
    fixedCtcLpa: z.number().min(0).max(1000).nullable().optional(),
    variableCtcLpa: z.number().min(0).max(1000).nullable().optional(),
    stipendPerMonthInr: z.number().int().min(0).max(10_000_000).nullable().optional(),
    applicationMode: z.enum(placementJobApplicationModes).optional().default("INTERNAL"),
    externalApplicationUrl: optionalHttpUrlSchema,
    applicationDeadline: z.coerce.date().nullable().optional(),
  })
  .strict();

export const createPlacementJobInputSchema =
  placementJobFieldsSchema.superRefine((value, ctx) => {
    const assessmentDeadline=value.legacyPostingDetails?.assessmentDeadline;
    if(assessmentDeadline){
      if(Date.parse(assessmentDeadline)<=Date.now())
        ctx.addIssue({code:"custom",path:["legacyPostingDetails","assessmentDeadline"],
          message:"Assessment deadline cannot be in the past"});
      if(!value.applicationDeadline||Date.parse(assessmentDeadline)<=value.applicationDeadline.getTime())
        ctx.addIssue({code:"custom",path:["legacyPostingDetails","assessmentDeadline"],
          message:"Assessment deadline must be after application deadline"});
    }
    if(value.fixedCtcLpa!=null&&value.variableCtcLpa!=null&&
      value.maximumAnnualCtcInr!=null&&(value.fixedCtcLpa+value.variableCtcLpa)*100000>value.maximumAnnualCtcInr){
      ctx.addIssue({code:"custom",path:["variableCtcLpa"],
        message:"Fixed and variable pay cannot exceed the recorded maximum annual CTC"});
    }
    if (
      value.minimumAnnualCtcInr != null &&
      value.maximumAnnualCtcInr != null &&
      value.maximumAnnualCtcInr < value.minimumAnnualCtcInr
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumAnnualCtcInr"],
        message: "Maximum CTC must be greater than or equal to minimum CTC",
      });
    }
    if (
      value.applicationMode !== "INTERNAL" &&
      !value.externalApplicationUrl
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["externalApplicationUrl"],
        message:
          "Hybrid and external-only jobs require an application URL",
      });
    }
  });

export const updatePlacementJobInputSchema =
  placementJobFieldsSchema
    .omit({
      collegeId: true,
      seasonId: true,
      companyRelationshipId: true,
    })
    .partial()
    .strict()
    .superRefine((value, ctx) => {
      if (Object.keys(value).length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Provide at least one job field",
        });
      }
      if (
        value.minimumAnnualCtcInr != null &&
        value.maximumAnnualCtcInr != null &&
        value.maximumAnnualCtcInr <
          value.minimumAnnualCtcInr
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["maximumAnnualCtcInr"],
          message:
            "Maximum CTC must be greater than or equal to minimum CTC",
        });
      }
    });

export type CreatePlacementJobInput = z.input<
  typeof createPlacementJobInputSchema
>;
export type UpdatePlacementJobInput = z.input<
  typeof updatePlacementJobInputSchema
>;

export const placementRoleOptionIdSchema =
  z.string().uuid();

const placementRoleOptionFieldsSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    employmentType: z.enum(
      placementEmploymentTypes,
    ),
    workMode: z.enum(
      placementJobWorkModes,
    ),
    locations: distinctTextList(20, 120)
      .optional()
      .default([]),
    openings: z
      .number()
      .int()
      .positive()
      .max(100_000)
      .nullable()
      .optional(),
    minimumAnnualCtcInr: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .nullable()
      .optional(),
    maximumAnnualCtcInr: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .nullable()
      .optional(),
    // Legacy named pay packages may include separate fixed/variable amounts,
    // joining bonus and internship duration, persisted on existing role rows.
    ctcLpa: z.number().min(0).max(1000).nullable().optional(),
    fixedLpa: z.number().min(0).max(1000).nullable().optional(),
    variableLpa: z.number().min(0).max(1000).nullable().optional(),
    joiningBonusLpa: z.number().min(0).max(1000).nullable().optional(),
    stipendPerMonthInr: z.number().min(0).max(10_000_000).nullable().optional(),
    stipendMonths: z.number().int().min(1).max(120).nullable().optional(),
  })
  .strict();

function validateRoleOptionCtc(
  value: {
    minimumAnnualCtcInr?: number | null;
    maximumAnnualCtcInr?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (
    value.minimumAnnualCtcInr != null &&
    value.maximumAnnualCtcInr != null &&
    value.maximumAnnualCtcInr <
      value.minimumAnnualCtcInr
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["maximumAnnualCtcInr"],
      message:
        "Maximum CTC must be greater than or equal to minimum CTC",
    });
  }
}

export const createPlacementRoleOptionInputSchema =
  placementRoleOptionFieldsSchema.superRefine(
    validateRoleOptionCtc,
  );

export const updatePlacementRoleOptionInputSchema =
  placementRoleOptionFieldsSchema
    .partial()
    .strict()
    .superRefine((value, ctx) => {
      if (Object.keys(value).length === 0) {
        ctx.addIssue({
          code: "custom",
          message:
            "Provide at least one role option field",
        });
      }
      validateRoleOptionCtc(value, ctx);
    });

export type CreatePlacementRoleOptionInput =
  z.input<
    typeof createPlacementRoleOptionInputSchema
  >;
export type UpdatePlacementRoleOptionInput =
  z.input<
    typeof updatePlacementRoleOptionInputSchema
  >;


const percentageSchema = z
  .number()
  .min(0)
  .max(100)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Use at most two decimal places",
  );

const cgpaSchema = z
  .number()
  .min(0)
  .max(10)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Use at most two decimal places",
  );

export const candidateAcademicEvidenceInputSchema = z
  .object({
    cgpa: cgpaSchema.nullable().optional().default(null),
    activeBacklogs: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    pastBacklogs: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    tenthPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    twelfthPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    diplomaPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    undergraduatePercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    gapYears: z
      .number()
      .int()
      .min(0)
      .max(50)
      .nullable()
      .optional()
      .default(null),
    isLateralEntry: z.boolean().optional().default(false),
    passingYear: z
      .number()
      .int()
      .min(1950)
      .max(2200)
      .nullable()
      .optional()
      .default(null),
  })
  .strict();

export const placementMissingEvidencePolicies = [
  "ALLOW_WITH_FLAG",
  "REQUIRE_COMPLETE",
] as const;

export const placementEligibilityPolicyInputSchema = z
  .object({
    allowedProgramIds: z
      .array(z.string().uuid())
      .max(100)
      .transform((values) => [...new Set(values)])
      .optional()
      .default([]),
    allowedCohortIds: z
      .array(z.string().uuid())
      .max(100)
      .transform((values) => [...new Set(values)])
      .optional()
      .default([]),
    allowedSectionIds: z.array(z.string().uuid()).max(100)
      .transform(values => [...new Set(values)]).optional().default([]),
    minCgpa: cgpaSchema.nullable().optional().default(null),
    maxActiveBacklogs: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    maxPastBacklogs: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    minTenthPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    minTwelfthPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    minDiplomaPercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    minUndergraduatePercentage: percentageSchema
      .nullable()
      .optional()
      .default(null),
    minPctThroughout: percentageSchema
      .nullable().optional().default(null),
    maxGapYears: z
      .number()
      .int()
      .min(0)
      .max(50)
      .nullable()
      .optional()
      .default(null),
    allowedPassingYears: z
      .array(z.number().int().min(1950).max(2200))
      .max(30)
      .transform((values) => [...new Set(values)])
      .optional()
      .default([]),
    requireVerifiedEvidence: z.boolean().optional().default(false),
    missingEvidencePolicy: z
      .enum(placementMissingEvidencePolicies)
      .optional()
      .default("ALLOW_WITH_FLAG"),
  })
  .strict();

export const placementEligibilityOverrideInputSchema = z
  .object({
    decision: z.enum(["INCLUDE", "EXCLUDE"],{error:"Choose include or exclude."}),
    reason: z.string().trim().min(3,"A reason is required.").max(1000),
    // Omitted for existing single-record callers; TPO bulk sends the
    // previewed active override ID (or null) to prevent stale overwrites.
    expectedOverrideId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type CandidateAcademicEvidenceInput = z.input<
  typeof candidateAcademicEvidenceInputSchema
>;
export type PlacementEligibilityPolicyInput = z.input<
  typeof placementEligibilityPolicyInputSchema
>;
export type PlacementEligibilityOverrideInput = z.input<
  typeof placementEligibilityOverrideInputSchema
>;


export const placementApplicationIdSchema =
  z.string().uuid();

export const placementApplicationChannels = [
  "INTERNAL",
  "EXTERNAL",
] as const;

/** Compatibility only: historical Java JobApplicationSourceValidator maps
 * every unrecognized/empty value to EXTERNAL. Never use on the live apply API:
 * the interactive request intentionally remains a strict enum and requires
 * external confirmation separately.
 */
export function normalizeHistoricalPlacementApplicationSource(
 source:unknown,
):"INTERNAL"|"EXTERNAL" {
 if(typeof source!=="string")return "EXTERNAL";
 const normalized=source.trim().toLocaleUpperCase("en-US");
 return normalized==="INTERNAL"?"INTERNAL":"EXTERNAL";
}
/** Legacy validation predicate deliberately differs from normalization:
 * blanks and unsupported values are not valid canonical source values.
 */
export function isHistoricalPlacementApplicationSource(source:unknown):boolean{
 return typeof source==="string"&&
  placementApplicationChannels.some(value=>
   value===source.trim().toLocaleUpperCase("en-US"));
}

export const createPlacementApplicationInputSchema =
  z
    .object({
      roleOptionId:
        placementRoleOptionIdSchema.optional(),
      channel: z
        .enum(placementApplicationChannels)
        .optional(),
      externalConfirmation: z
        .boolean()
        .optional()
        .default(false),
    })
    .strict();

export type CreatePlacementApplicationInput =
  z.input<
    typeof createPlacementApplicationInputSchema
  >;


export const placementScreeningStatuses = [
  "PENDING",
  "HOLD",
  "SHORTLISTED",
  "REJECTED",
] as const;

export const placementScreeningDecisionInputSchema =
  z
    .object({
      decision: z.enum([
        "HOLD",
        "SHORTLISTED",
        "REJECTED",
      ]),
      candidateMessage: z
        .string()
        .trim()
        .min(1)
        .max(1000)
        .nullable()
        .optional(),
      internalReason: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        value.decision === "REJECTED" &&
        !value.candidateMessage
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["candidateMessage"],
          message:
            "Rejected candidates require a candidate-facing message",
        });
      }
      if (
        value.decision === "HOLD" &&
        !value.internalReason
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["internalReason"],
          message:
            "Hold decisions require an internal reason",
        });
      }
    });

export type PlacementScreeningDecisionInput =
  z.input<
    typeof placementScreeningDecisionInputSchema
  >;


export const placementRoundIdSchema =
  z.string().uuid();

export const placementRoundKinds = [
  "TALK",
  "TEST",
  "VENDOR_TEST",
  "GD",
  "INTERVIEW",
] as const;

export const placementRoundModes = [
  "ON_CAMPUS",
  "VIRTUAL",
] as const;

const placementTimeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: value,
      }).format();
      return true;
    } catch {
      return false;
    }
  }, "Use a valid IANA timezone");

const placementRoundDefinitionFields = {
  kind: z.enum(placementRoundKinds),
  name: z.string().trim().min(1).max(100),
  whatToBring: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .nullable()
    .optional(),
  platform: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .nullable()
    .optional(),
  testUrl: optionalHttpUrlSchema,
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(1440)
    .nullable()
    .optional(),
};

export const createPlacementRoundInputSchema =
  z.object(placementRoundDefinitionFields).strict();

export const updatePlacementRoundInputSchema =
  z
    .object(placementRoundDefinitionFields)
    .partial()
    .strict()
    .superRefine((value, ctx) => {
      if (Object.keys(value).length === 0) {
        ctx.addIssue({
          code: "custom",
          message:
            "Provide at least one round field",
        });
      }
    });

export const placementRoundActionInputSchema =
  z
    .object({
      action: z.enum([
        "SCHEDULE",
        "COMPLETE",
        "CANCEL",
      ]),
      scheduledAt: z.coerce
        .date()
        .optional(),
      timezone:
        placementTimeZoneSchema.optional(),
      mode: z
        .enum(placementRoundModes)
        .optional(),
      venue: z
        .string()
        .trim()
        .min(1)
        .max(500)
        .nullable()
        .optional(),
      meetingUrl:
        optionalHttpUrlSchema,
      resultsDueAt: z.coerce
        .date()
        .nullable()
        .optional(),
      reason: z
        .string()
        .trim()
        .min(3)
        .max(1000)
        .optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.action === "SCHEDULE") {
        if (!value.scheduledAt) {
          ctx.addIssue({
            code: "custom",
            path: ["scheduledAt"],
            message:
              "A scheduled round requires a date and time",
          });
        }
        if (!value.timezone) {
          ctx.addIssue({
            code: "custom",
            path: ["timezone"],
            message:
              "A scheduled round requires a timezone",
          });
        }
        if (!value.mode) {
          ctx.addIssue({
            code: "custom",
            path: ["mode"],
            message:
              "A scheduled round requires a mode",
          });
        }
        if (
          value.mode === "ON_CAMPUS" &&
          !value.venue
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["venue"],
            message:
              "On-campus rounds require a venue",
          });
        }
        if (
          value.mode === "VIRTUAL" &&
          !value.meetingUrl
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["meetingUrl"],
            message:
              "Virtual rounds require a meeting URL",
          });
        }
        if (
          value.scheduledAt &&
          value.resultsDueAt &&
          value.resultsDueAt <
            value.scheduledAt
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["resultsDueAt"],
            message:
              "Results due time cannot be before the round starts",
          });
        }
      } else {
        if (
          value.scheduledAt !== undefined ||
          value.timezone !== undefined ||
          value.mode !== undefined ||
          value.venue !== undefined ||
          value.meetingUrl !== undefined ||
          value.resultsDueAt !== undefined
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "Schedule fields are only valid for the SCHEDULE action",
          });
        }
        if (
          value.action === "CANCEL" &&
          !value.reason
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["reason"],
            message:
              "Cancelling a round requires a reason",
          });
        }
      }
    });

export const reorderPlacementRoundsInputSchema =
  z
    .object({
      roundIds: z
        .array(z.string().uuid())
        .min(1)
        .max(50)
        .refine(
          (ids) =>
            new Set(ids).size === ids.length,
          "Round IDs must be unique",
        ),
    })
    .strict();

export type CreatePlacementRoundInput =
  z.input<
    typeof createPlacementRoundInputSchema
  >;
export type UpdatePlacementRoundInput =
  z.input<
    typeof updatePlacementRoundInputSchema
  >;
export type PlacementRoundActionInput =
  z.input<
    typeof placementRoundActionInputSchema
  >;
export type ReorderPlacementRoundsInput =
  z.input<
    typeof reorderPlacementRoundsInputSchema
  >;


export const placementEvaluationConfigRoundSchema =
  z
    .object({
      id: placementRoundIdSchema,
      ...placementRoundDefinitionFields,
    })
    .strict();

export const placementEvaluationConfigInputSchema =
  z
    .object({
      rounds: z
        .array(placementEvaluationConfigRoundSchema)
        .max(50)
        .refine(
          (rounds) =>
            new Set(rounds.map((round) => round.id)).size ===
            rounds.length,
          "Round IDs must be unique",
        ),
    })
    .strict();

export type PlacementEvaluationConfigInput =
  z.input<
    typeof placementEvaluationConfigInputSchema
  >;


export const placementResultIdSchema =
  z.string().uuid();

export const placementRoundResultOutcomes = [
  "PASS",
  "FAIL",
  "HOLD",
  "ABSENT",
] as const;

export const placementRoundResultReasonCategories = [
  "APTITUDE",
  "TECHNICAL",
  "COMMUNICATION",
  "OTHER",
] as const;

export const stagePlacementRoundResultInputSchema =
  z
    .object({
      applicationId: placementApplicationIdSchema,
      outcome: z.enum(
        placementRoundResultOutcomes,
      ),
      waitlistRank: z
        .number()
        .int()
        .positive()
        .max(100_000)
        .nullable()
        .optional(),
      scorePercent: z
        .number()
        .int()
        .min(0)
        .max(100)
        .nullable()
        .optional(),
      reasonCategory: z
        .enum(
          placementRoundResultReasonCategories,
        )
        .nullable()
        .optional(),
      candidateMessage: z
        .string()
        .trim()
        .min(1)
        .max(1000)
        .nullable()
        .optional(),
      internalComment: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        value.outcome === "HOLD" &&
        !value.waitlistRank
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["waitlistRank"],
          message:
            "Hold results require a waitlist rank",
        });
      }
      if (
        value.outcome !== "HOLD" &&
        value.waitlistRank != null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["waitlistRank"],
          message:
            "Waitlist rank is only valid for hold results",
        });
      }
      if (
        value.outcome !== "PASS" &&
        !value.candidateMessage
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["candidateMessage"],
          message:
            "Non-pass results require a candidate-facing message",
        });
      }
    });

export const applyPlacementRoundResultInputSchema =
  z
    .object({
      action: z.literal("APPLY"),
    })
    .strict();

export type StagePlacementRoundResultInput =
  z.input<
    typeof stagePlacementRoundResultInputSchema
  >;


export const placementOfferIdSchema =
  z.string().uuid();

const placementDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Use YYYY-MM-DD",
  )
  .refine((value) => {
    const date = new Date(
      value + "T00:00:00Z",
    );
    return (
      !Number.isNaN(date.getTime()) &&
      date
        .toISOString()
        .slice(0, 10) === value
    );
  }, "Use a valid date");

export const issuePlacementOfferInputSchema =
  z
    .object({
      kind: z.enum(["OFFER", "LOI"]).optional(),
      roleTitle: z
        .string()
        .trim()
        .min(2)
        .max(200),
      annualCtcInr: z
        .number()
        .int()
        .min(0)
        .max(100_000_000)
        .nullable()
        .optional(),
      joiningDate:
        placementDateSchema
          .nullable()
          .optional(),
      expiresAt: z.coerce
        .date()
        .nullable()
        .optional(),
    })
    .strict();

export const placementOfferActionSchema =
  z.discriminatedUnion("action", [
    z
      .object({
        action: z.literal("ACCEPT"),
      })
      .strict(),
    z
      .object({
        action: z.literal("DECLINE"),
        reason: z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .nullable()
          .optional(),
      })
      .strict(),
    z
      .object({
        action: z.literal("WITHDRAW"),
        reason: z
          .string()
          .trim()
          .min(1)
          .max(2000),
      })
      .strict(),
  ]);

export const placementJoiningOutcomeInputSchema =
  z
    .object({
      status: z.enum([
        "JOINED",
        "DID_NOT_JOIN",
        "DEFERRED",
      ]),
      joiningDate:
        placementDateSchema
          .nullable()
          .optional(),
      reason: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
      correctionReason: z
        .string()
        .trim()
        .min(1)
        .max(2000)
        .nullable()
        .optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (
        (value.status === "JOINED" ||
          value.status === "DEFERRED") &&
        !value.joiningDate
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["joiningDate"],
          message:
            "Joining date is required for joined or deferred outcomes",
        });
      }

      if (
        (value.status ===
          "DID_NOT_JOIN" ||
          value.status ===
            "DEFERRED") &&
        !value.reason
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["reason"],
          message:
            "Reason is required for this joining outcome",
        });
      }
    });

export type IssuePlacementOfferInput =
  z.input<
    typeof issuePlacementOfferInputSchema
  >;
export type PlacementOfferActionInput =
  z.input<
    typeof placementOfferActionSchema
  >;
export type PlacementJoiningOutcomeInput =
  z.input<
    typeof placementJoiningOutcomeInputSchema
  >;


export const placementRequestIdSchema =
  z.string().uuid();

const placementRequestReasonSchema = z
  .string()
  .trim()
  .min(3)
  .max(2000);

export const createPlacementRequestInputSchema =
  z
    .discriminatedUnion("requestType", [
      z
        .object({
          requestType: z.literal("APPLICATION_WITHDRAWAL"),
          applicationId: placementApplicationIdSchema,
          expectedUpdatedAt: z.string().datetime({offset:true}).optional(),
          reason: placementRequestReasonSchema,
        })
        .strict(),
      z
        .object({
          requestType: z.literal("ROUND_RESCHEDULE"),
          applicationId: placementApplicationIdSchema,
          roundId: placementRoundIdSchema,
          reason: placementRequestReasonSchema,
          scheduledAt: z.coerce.date(),
          timezone: z.string().trim().min(1).max(64),
          mode: z.enum(["ON_CAMPUS", "VIRTUAL"]),
          venue: z.string().trim().min(1).max(500).nullable().optional(),
          meetingUrl: z.string().url().max(2000).nullable().optional(),
        })
        .strict(),
      z
        .object({
          requestType: z.literal("OFFER_EXTENSION"),
          applicationId: placementApplicationIdSchema,
          offerId: placementOfferIdSchema,
          reason: placementRequestReasonSchema,
          requestedExpiresAt: z.coerce.date(),
          expectedExpiresAt: z.string().datetime({offset:true}).optional(),
        })
        .strict(),
    ])
    .superRefine((value, ctx) => {
      if (
        value.requestType === "ROUND_RESCHEDULE" &&
        value.mode === "ON_CAMPUS" &&
        !value.venue
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["venue"],
          message:
            "Venue is required for an on-campus reschedule",
        });
      }
      if (
        value.requestType === "ROUND_RESCHEDULE" &&
        value.mode === "VIRTUAL" &&
        !value.meetingUrl
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["meetingUrl"],
          message:
            "Meeting URL is required for a virtual reschedule",
        });
      }
    });

export const placementRequestActionSchema =
  z.discriminatedUnion("action", [
    z
      .object({
        action: z.literal("APPROVE"),
        note: z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .nullable()
          .optional(),
      })
      .strict(),
    z
      .object({
        action: z.literal("REJECT"),
        note: z
          .string()
          .trim()
          .min(3)
          .max(2000),
      })
      .strict(),
    z
      .object({
        action: z.literal("CANCEL"),
      })
      .strict(),
  ]);

export type CreatePlacementRequestInput =
  z.input<typeof createPlacementRequestInputSchema>;
export type PlacementRequestActionInput =
  z.input<typeof placementRequestActionSchema>;

export const placementDriveDayCoordinatorInputSchema =
  z
    .object({
      learnerMembershipId: z.string().uuid(),
      onDate: placementCalendarDateSchema,
    })
    .strict();

export const placementDriveDayAttendanceStatuses = [
  "PRESENT",
  "IN_INTERVIEW",
  "DONE",
  "ABSENT",
] as const;

export const placementDriveDayAttendanceInputSchema =
  z
    .object({
      applicationId:
        placementApplicationIdSchema,
      status: z.enum(
        placementDriveDayAttendanceStatuses,
      ),
      room: z
        .string()
        .trim()
        .min(1)
        .max(160)
        .nullable()
        .optional(),
    })
    .strict();

export type PlacementDriveDayCoordinatorInput =
  z.input<
    typeof placementDriveDayCoordinatorInputSchema
  >;
export type PlacementDriveDayAttendanceInput =
  z.input<
    typeof placementDriveDayAttendanceInputSchema
  >;
