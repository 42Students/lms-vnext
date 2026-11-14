import { z } from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const tpoDriveDayCheckInSchema = z.object({
  confirmed: z.literal(true),
  applicationId: zUuid,
  expectedAttendance: z.enum(["WAITING", "PRESENT", "IN_INTERVIEW", "DONE", "ABSENT"]),
  status: z.enum(["PRESENT", "IN_INTERVIEW", "DONE", "ABSENT"]),
  room: z.string().trim().max(120).nullable().optional(),
}).strict();

export function decideTpoAttendanceTransition(
  stored: string | null,
  expected: string,
  requested: "PRESENT" | "IN_INTERVIEW" | "DONE" | "ABSENT",
): "UPDATE" | "UNCHANGED" | "STALE" {
  const current = stored ?? "WAITING";
  if (current !== expected) return "STALE";
  return current === requested ? "UNCHANGED" : "UPDATE";
}
