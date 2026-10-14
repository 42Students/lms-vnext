import { z } from "zod";
export const tpoDriveDayCheckInSchema = z.object({
  confirmed: z.literal(true),
  applicationId: z.string().uuid(),
  expectedAttendance: z.enum(["WAITING", "PRESENT", "ABSENT"]),
  status: z.enum(["PRESENT", "ABSENT"]),
}).strict();

export function decideTpoAttendanceTransition(
  stored: string | null,
  expected: string,
  requested: "PRESENT" | "ABSENT",
): "UPDATE" | "UNCHANGED" | "STALE" {
  const current = stored ?? "WAITING";
  if (current !== expected) return "STALE";
  return current === requested ? "UNCHANGED" : "UPDATE";
}
