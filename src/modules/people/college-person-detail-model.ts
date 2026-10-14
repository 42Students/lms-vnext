import { z } from "zod";
import { LEARNER_PROGRAM_ENROLLMENT_STATUSES } from "@/modules/academics/constants";

export const collegePersonIdSchema = z.string().uuid();
export const collegePersonDetailQuerySchema = z.strictObject({});
export const collegeStudentEnrollmentQuerySchema = z.strictObject({
  status: z.union([z.literal("ALL"),z.enum(LEARNER_PROGRAM_ENROLLMENT_STATUSES)]).default("ALL"),
});

export class CollegePersonNotFoundError extends Error {
  readonly code = "NOT_FOUND";
  constructor() {
    super("Person not found");
    this.name = "CollegePersonNotFoundError";
  }
}

export type AttendanceSummaryRow = {
  status: string;
  count: number;
};

export function recordedAttendanceSummary(rows: readonly AttendanceSummaryRow[]) {
  const byStatus = new Map(rows.map(row => [row.status, row.count]));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const recordedPresent = (byStatus.get("PRESENT") ?? 0) + (byStatus.get("LATE") ?? 0);
  return {
    recordedMarkedEvents: total,
    presentOrLate: recordedPresent,
    absent: byStatus.get("ABSENT") ?? 0,
    excused: byStatus.get("EXCUSED") ?? 0,
    medical: byStatus.get("MEDICAL") ?? 0,
    // This denominator is only explicitly recorded status rows, not all scheduled sessions.
    recordedPercent: total > 0 ? Math.round((recordedPresent / total) * 100) : null,
  };
}
