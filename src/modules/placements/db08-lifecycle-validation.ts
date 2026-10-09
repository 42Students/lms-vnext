import { z } from "zod";

export const db08Uuid = z.string().uuid();
const dateString = z.iso.date();
const timestampString = z.iso.datetime({ offset: true });

export const placementBatchInputSchema = z
  .object({
    collegeId: db08Uuid,
    cohortId: db08Uuid,
    registrationDeadline: timestampString.nullable().optional(),
    rulesOverride: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export const placementBatchTransitionSchema = z
  .object({
    collegeId: db08Uuid,
    cohortId: db08Uuid,
    action: z.enum(["INVITE", "FINISH"]),
  })
  .strict();

export const placementRegistrationInputSchema = z
  .object({
    collegeId: db08Uuid,
    seasonId: db08Uuid,
    membershipId: db08Uuid,
    choice: z.enum(["PLACEMENTS", "HIGHER_STUDIES", "NOT_INTERESTED"]),
    consentVersion: z.string().trim().min(1).max(10).nullable().optional(),
    outcomeLabel: z.string().trim().max(60).nullable().optional(),
    outcomeDetail: z.string().trim().max(200).nullable().optional(),
  })
  .strict();

export const placementDebarmentInputSchema = z
  .object({
    collegeId: db08Uuid,
    membershipId: db08Uuid,
    reason: z.string().trim().min(1).max(500),
    untilDate: dateString.nullable().optional(),
    untilDrives: z.number().int().min(1).max(10000).nullable().optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.untilDate && input.untilDrives != null) {
      ctx.addIssue({
        code: "custom",
        path: ["untilDrives"],
        message: "Use one debarment expiry method, not both",
      });
    }
  });

export const placementDebarmentActionSchema = z
  .object({
    collegeId: db08Uuid,
    debarmentId: db08Uuid,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const placementDebarmentDriveSchema = z
  .object({
    collegeId: db08Uuid,
    debarmentId: db08Uuid,
    jobId: db08Uuid,
  })
  .strict();

/** INR integer is authoritative. Avoid floating rupee/CTC rounding. */
export const placementExternalOutcomeInputSchema = z
  .object({
    collegeId: db08Uuid,
    membershipId: db08Uuid,
    companyName: z.string().trim().min(1).max(200),
    annualCtcInr: z.number().int().nonnegative().max(9_999_999_999_000)
      .nullable().optional(),
    letterObjectPath: z.string().trim().min(1).max(1500)
      .nullable().optional(),
    requestId: db08Uuid.nullable().optional(),
  })
  .strict();

export const placementExternalOutcomeRevokeSchema = z
  .object({
    collegeId: db08Uuid,
    outcomeId: db08Uuid,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export type PlacementRegistrationInput = z.infer<
  typeof placementRegistrationInputSchema
>;
