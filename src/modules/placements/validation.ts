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

export const createPlacementCompanyInputSchema = z
  .object({
    collegeId: z.string().uuid(),
    name: z.string().trim().min(2).max(200),
    websiteUrl: httpUrlSchema.optional(),
    primaryDomain: placementCompanyDomainSchema.optional(),
    isTrusted: z.boolean().optional().default(false),
  })
  .strict();

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

const placementJobFieldsSchema = z
  .object({
    collegeId: z.string().uuid(),
    companyRelationshipId: z.string().uuid(),
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(1).max(20_000),
    employmentType: z.enum(placementEmploymentTypes),
    workMode: z.enum(placementJobWorkModes),
    locations: distinctTextList(20, 120).optional().default([]),
    openings: z.number().int().positive().max(100_000).nullable().optional(),
    minimumAnnualCtcInr: z.number().int().min(0).max(100_000_000).nullable().optional(),
    maximumAnnualCtcInr: z.number().int().min(0).max(100_000_000).nullable().optional(),
    applicationMode: z.enum(placementJobApplicationModes).optional().default("INTERNAL"),
    externalApplicationUrl: optionalHttpUrlSchema,
    applicationDeadline: z.coerce.date().nullable().optional(),
  })
  .strict();

export const createPlacementJobInputSchema =
  placementJobFieldsSchema.superRefine((value, ctx) => {
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
      value.applicationMode === "EXTERNAL_ONLY" &&
      !value.externalApplicationUrl
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["externalApplicationUrl"],
        message: "External-only jobs require an application URL",
      });
    }
  });

export const updatePlacementJobInputSchema =
  placementJobFieldsSchema
    .omit({
      collegeId: true,
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
