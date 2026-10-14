import { z } from "zod";

export const facultyStudentDetailParamsSchema = z.object({
  deliveryId: z.string().uuid(),
  membershipId: z.string().uuid(),
}).strict();

export function findAuthorizedFacultyStudent<T extends { membershipId: string }>(
  roster: readonly T[], membershipId: string,
): T | null {
  return roster.find(row => row.membershipId === membershipId) ?? null;
}

export function summarizeFacultyStudentAttendance(input: {
  present: number; absent: number; unmarked: number; upcoming: number;
  attendedPercent: number | null;
}) {
  return {
    present: input.present,
    absent: input.absent,
    unmarked: input.unmarked,
    upcoming: input.upcoming,
    recorded: input.present + input.absent,
    percent: input.attendedPercent,
  };
}
