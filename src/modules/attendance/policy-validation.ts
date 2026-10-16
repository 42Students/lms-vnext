import { z } from "zod";

/**
 * These boundaries match the registered
 * attendance_policies PostgreSQL CHECK constraints.
 *
 * Do not coerce strings: API consumers must submit
 * actual integer JSON numbers.
 */
export const attendancePolicyUpdateSchema =
  z.strictObject({
    collegeId: z.string().uuid(),
    eligibilityThresholdPercent: z
      .number()
      .int()
      .min(1)
      .max(100),
    correctionWindowHours: z
      .number()
      .int()
      .min(1)
      .max(8760),
  });

export type AttendancePolicyUpdateInput =
  z.infer<typeof attendancePolicyUpdateSchema>;

export const DEFAULT_ATTENDANCE_POLICY = {
  eligibilityThresholdPercent: 75,
  correctionWindowHours: 24,
} as const;
