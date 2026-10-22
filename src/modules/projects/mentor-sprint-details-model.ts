import { z } from "zod";

/** Registered migration 0123: goal, definition of done and sprint dates. */
export const mentorSprintDetailsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueLabel:z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(4000).nullable(),
  goal:z.string().trim().max(4000).nullable(),
  definitionOfDone:z.string().trim().max(4000).nullable(),
  startDate:z.iso.date().nullable(),endDate:z.iso.date().nullable(),dueDate:z.iso.date().nullable(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  expectedPlanToken: z.string().min(3).max(80).optional(),
}).strict().superRefine((v,ctx)=>{
 if(v.startDate&&v.endDate&&v.endDate<v.startDate)ctx.addIssue({code:"custom",path:["endDate"],message:"End date must follow start date"});
});

export const mentorSprintDetailsParamsSchema = z.object({
  projectId: z.string().uuid(),
  sprintId: z.string().uuid(),
}).strict();

export type MentorSprintDetailsInput = z.infer<typeof mentorSprintDetailsSchema>;

export function sprintDetailsChanged(
  before: {title:string;dueLabel?:string|null; description:string|null; goal:string|null; definitionOfDone:string|null; startDate:string|null; endDate:string|null; dueDate:string|null },
  next: Omit<MentorSprintDetailsInput,"expectedUpdatedAt">,
) {
  return before.title!==next.title ||
    (next.dueLabel!==undefined&&before.dueLabel!==next.dueLabel)||
    (before.description ?? null) !== next.description ||
 before.goal!==next.goal||before.definitionOfDone!==next.definitionOfDone||
 before.startDate!==next.startDate||before.endDate!==next.endDate||before.dueDate!==next.dueDate;
}

/** Release-wide optimistic fingerprint. This changes on sibling insertion,
 * deletion, status change and reorder, even when the edited sprint itself
 * retains its original revision. Its inputs are scoped to one live release.
 */
export function mentorSprintPlanRevisionToken(rows:readonly {
 id:string;sequence:number;status:string;updatedAt:Date|string;
}[]):string{
 const canonical=[...rows].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))
  .map(row=>row.id+":"+row.sequence+":"+row.status+":"+
    new Date(row.updatedAt).toISOString()).join("|");
 let first=2166136261,second=0x811c9dc5;
 for(let i=0;i<canonical.length;i++){
  const code=canonical.charCodeAt(i);
  first=Math.imul(first^code,16777619)>>>0;
  second=Math.imul(second^(code+i),2246822519)>>>0;
 }
 return rows.length.toString(36)+"-"+first.toString(36)+"-"+second.toString(36);
}
