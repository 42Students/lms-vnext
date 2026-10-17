import { z } from "zod";
import { updateCourseAssignmentInputSchema } from "./assignment-validation";
import {assignmentMethodsSchema} from "./assignment-submission-methods";

export const facultyAssignmentParamsSchema=z.object({
  deliveryId:z.string().uuid(),
}).strict();

const text=z.string().trim().min(1).max(10000);
const common=z.object({
  title:z.string().trim().min(1).max(255),
  description:text.nullable(),
  dueAt:z.iso.datetime({offset:true}).nullable(),
  maxPoints:z.number().int().min(0).max(1000),
  allowedMethods:assignmentMethodsSchema.optional(),
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

/** SQL now() is microsecond-precise, but JS Date snapshots use milliseconds. */
export function facultyAssignmentVersionMatches(current:Date,expected:string){
 const given=new Date(expected);
 return Number.isFinite(given.getTime())&&current.getTime()===given.getTime();
}

/** The legacy partial editor must use the same confirmed Faculty command. */
export function facultyAssignmentLegacyEdit(current: {
  id: string; title: string; description: string | null; dueAt: Date | null;
  maxPoints: number; sequence: number;
}, raw: unknown) {
  const input = updateCourseAssignmentInputSchema.parse(raw);
  // Sequence belongs to the separate lesson-order workflow, not this editor.
  if (input.sequence !== undefined) z.literal(current.sequence).parse(input.sequence);
  return facultyAssignmentCommandSchema.parse({
    action: "EDIT", assignmentId: current.id,
    title: input.title ?? current.title,
    description: input.description === undefined ? current.description : input.description,
    dueAt: input.dueAt === undefined ? current.dueAt?.toISOString() ?? null : input.dueAt,
    maxPoints: input.maxPoints ?? current.maxPoints,
    allowedMethods:undefined,
    expectedUpdatedAt: input.expectedUpdatedAt, confirmed: input.confirmed,
  });
}

/** Only the title may change after any learner submission; history is immutable. */
export function facultyAssignmentEditLockedBySubmissions(changes: readonly string[],hasSubmissions:boolean){
 return hasSubmissions&&changes.some(field=>field!=="title");
}
