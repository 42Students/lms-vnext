import { z } from "zod";

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(s + "T00:00:00.000Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}, "Date must be an existing YYYY-MM-DD date");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const recurringPreviewSchema = z.object({
  sectionId: z.string().uuid(),
  from: daySchema,
  to: daySchema,
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
  facultyMembershipId: z.string().uuid().nullable().optional(),
  lectureHallId: z.string().uuid().nullable().optional(),
  deliveryId: z.string().uuid().nullable().optional(),
}).strict().superRefine((v, ctx) => {
  if (v.from > v.to) ctx.addIssue({ code: "custom", path: ["to"], message: "End date precedes start" });
  const days = Math.round((Date.parse(v.to + "T00:00:00Z") -
    Date.parse(v.from + "T00:00:00Z")) / 86400000);
  if (days > 92) ctx.addIssue({ code: "custom", path: ["to"], message: "Maximum 93 inclusive days" });
  if (v.endTime <= v.startTime) ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must follow start" });
  if (new Set(v.weekdays).size !== v.weekdays.length)
    ctx.addIssue({ code: "custom", path: ["weekdays"], message: "Duplicate weekdays" });
});

export type RecurringPreviewInput = z.infer<typeof recurringPreviewSchema>;
export type PreviewConflict = "SECTION_BUSY" | "FACULTY_BUSY" | "HALL_BUSY";
export type RecurringSlot = { startsAt: string; endsAt: string; localDate: string; conflicts: PreviewConflict[] };
export type ScheduledEvent = {
  sectionId: string;
  facultyMembershipId: string | null;
  lectureHallId: string | null;
  startsAt: Date;
  endsAt: Date;
};

export function expandIstSessions(input: RecurringPreviewInput): Omit<RecurringSlot, "conflicts">[] {
  const selected = new Set(input.weekdays);
  const result: Omit<RecurringSlot, "conflicts">[] = [];
  const [sh, sm] = input.startTime.split(":").map(Number);
  const [eh, em] = input.endTime.split(":").map(Number);
  for (let ms = Date.parse(input.from + "T00:00:00Z");
    ms <= Date.parse(input.to + "T00:00:00Z"); ms += 86400000) {
    const day = new Date(ms);
    if (selected.size > 0 && !selected.has(day.getUTCDay())) continue;
    const startsAt = new Date(ms + (sh * 60 + sm - 330) * 60000);
    const endsAt = new Date(ms + (eh * 60 + em - 330) * 60000);
    result.push({
      localDate: day.toISOString().slice(0, 10),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }
  return result;
}

export function findPreviewConflicts(
  slot: Pick<RecurringSlot, "startsAt" | "endsAt">,
  input: RecurringPreviewInput,
  existing: readonly ScheduledEvent[],
): PreviewConflict[] {
  const start = new Date(slot.startsAt).getTime();
  const end = new Date(slot.endsAt).getTime();
  const found = new Set<PreviewConflict>();
  for (const row of existing) {
    if (start >= row.endsAt.getTime() || end <= row.startsAt.getTime()) continue;
    if (row.sectionId === input.sectionId) found.add("SECTION_BUSY");
    if (input.facultyMembershipId && input.facultyMembershipId === row.facultyMembershipId) found.add("FACULTY_BUSY");
    if (input.lectureHallId && input.lectureHallId === row.lectureHallId) found.add("HALL_BUSY");
  }
  return (["SECTION_BUSY", "FACULTY_BUSY", "HALL_BUSY"] as const).filter((code) => found.has(code));
}
