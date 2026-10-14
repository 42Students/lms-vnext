import { z } from "zod";

export const facultyAssignmentParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();

const text=z.string().trim().min(1).max(10000);
const common=z.object({
  title:z.string().trim().min(1).max(255),
  description:text.nullable(),
  dueAt:z.iso.datetime({offset:true}).nullable(),
  maxPoints:z.number().int().min(1).max(10000),
}).strict();
const expected=z.iso.datetime({offset:true});
export const facultyAssignmentCommandSchema=z.discriminatedUnion("action",[
  common.extend({
    action:z.literal("CREATE"),
    lessonId:z.string().uuid(),
    sequence:z.number().int().min(0).max(10000),
    confirmed:z.literal(true),
  }),
  common.extend({
    action:z.literal("EDIT"),
    assignmentId:z.string().uuid(),
    expectedUpdatedAt:expected,
    confirmed:z.literal(true),
  }),
  z.object({
    action:z.enum(["PUBLISH","ARCHIVE"]),
    assignmentId:z.string().uuid(),
    expectedUpdatedAt:expected,
    confirmed:z.literal(true),
  }).strict(),
]);
export type FacultyAssignmentCommand=z.infer<typeof facultyAssignmentCommandSchema>;

export function assignmentFieldsChanged(
  current:{title:string;description:string|null;dueAt:Date|null;maxPoints:number},
  next:{title:string;description:string|null;dueAt:string|null;maxPoints:number},
) {
  const changed:string[]=[];
  if(current.title!==next.title)changed.push("title");
  if((current.description??null)!==(next.description??null))changed.push("description");
  if((current.dueAt?.getTime()??null)!==(next.dueAt?new Date(next.dueAt).getTime():null))changed.push("dueAt");
  if(current.maxPoints!==next.maxPoints)changed.push("maxPoints");
  return changed;
}
