import { z } from "zod";

export const projectMeetingPlanRowSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  agenda: z.string().trim().max(4000).nullable(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  linkedSprintId: z.uuid().nullable(),
  linkedTaskId: z.uuid().nullable(),
});
export type ProjectMeetingPlanRow = z.infer<typeof projectMeetingPlanRowSchema>;

export const projectMeetingPlanSchema = z.strictObject({
  expectedMeetingsToken: z.string().regex(/^[a-f0-9]{64}$/),
  meetings: z.array(projectMeetingPlanRowSchema).min(1).max(100),
}).superRefine((input, ctx) => {
  const ids = new Set<string>();
  input.meetings.forEach((meeting, index) => {
    if (ids.has(meeting.id)) {
      ctx.addIssue({ code: "custom", message: "Duplicate meeting", path: ["meetings", index, "id"] });
    }
    ids.add(meeting.id);
    if (Date.parse(meeting.endsAt) <= Date.parse(meeting.startsAt)) {
      ctx.addIssue({ code: "custom", message: "End time must follow start", path: ["meetings", index, "endsAt"] });
    }
  });
});

export function projectMeetingPlanFieldsChanged(before: {
  title: string; agenda: string | null; startsAt: Date; endsAt: Date;
  linkedSprintId: string | null; linkedTaskId: string | null;
}, next: ProjectMeetingPlanRow) {
  return before.title !== next.title || before.agenda !== next.agenda ||
    before.startsAt.getTime() !== Date.parse(next.startsAt) ||
    before.endsAt.getTime() !== Date.parse(next.endsAt) ||
    before.linkedSprintId !== next.linkedSprintId ||
    before.linkedTaskId !== next.linkedTaskId;
}
