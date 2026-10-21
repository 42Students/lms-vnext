import {z} from "zod";
import {createCourseQuizInputSchema, updateCourseQuizInputSchema} from "./quiz-validation";

export const facultyQuizParamsSchema=z.object({deliveryId:z.string().uuid()}).strict();
const fields=z.object({
 title:z.string().trim().min(1).max(255),
 description:z.string().trim().max(10000).nullable(),
 dueAt:z.iso.datetime({offset:true}).nullable(),
 maxAttempts:z.number().int().min(1).max(20),
 shuffleQuestions:z.boolean().optional(),
 shuffleOptions:z.boolean().optional(),
 questions:createCourseQuizInputSchema.shape.questions.refine(rows=>rows.every(q=>q.points<=100),{message:"Question points must be between 1 and 100."}),
}).strict();
export const facultyQuizCommandSchema=z.discriminatedUnion("action",[
 fields.extend({
  action:z.literal("CREATE"),
  lessonId:z.string().uuid(),sequence:z.number().int().min(0).max(10000),
  confirmed:z.literal(true),
 }),
 fields.omit({questions:true}).extend({
  questions:fields.shape.questions.optional(),
  action:z.literal("EDIT"),
  quizId:z.string().uuid(),expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmed:z.literal(true),
 }),
 z.object({
  action:z.enum(["PUBLISH","UNPUBLISH","CLOSE","ARCHIVE"]),quizId:z.string().uuid(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),confirmed:z.literal(true),
 }).strict(),
]);
export type FacultyQuizCommand=z.infer<typeof facultyQuizCommandSchema>;
export function sumQuizPoints(questions:readonly {points:number}[]){
 return questions.reduce((sum,q)=>sum+q.points,0);
}

/** Compare database microsecond timestamps by their JS Date millisecond view. */
export function facultyQuizVersionMatches(current:Date,expected:string){
 const proposed=new Date(expected);
 return Number.isFinite(proposed.getTime())&&current.getTime()===proposed.getTime();
}

/** Omitted questions preserve the persisted choice bank for metadata-only edits. */
export function facultyQuizLegacyEdit(current: {
 id:string;title:string;description:string|null;dueAt:Date|null;maxAttempts:number;sequence:number;
},raw:unknown) {
 const input=updateCourseQuizInputSchema.parse(raw);
 if(input.sequence!==undefined)z.literal(current.sequence).parse(input.sequence);
 return facultyQuizCommandSchema.parse({
  action:"EDIT",quizId:current.id,title:input.title??current.title,
  description:input.description===undefined?current.description:input.description,
  dueAt:input.dueAt===undefined?current.dueAt?.toISOString()??null:input.dueAt,
  maxAttempts:input.maxAttempts??current.maxAttempts,
  ...(input.shuffleQuestions!==undefined?{shuffleQuestions:input.shuffleQuestions}:{}),
  ...(input.shuffleOptions!==undefined?{shuffleOptions:input.shuffleOptions}:{}),
  ...(input.questions?{questions:input.questions}:{}),
  expectedUpdatedAt:input.expectedUpdatedAt,confirmed:input.confirmed,
 });
}

/** Metadata-only edits should not add an audit event or bump the version
 * when the persisted and requested values describe the same instant. */
export function facultyQuizMetadataUnchanged(
 current:{title:string;description:string|null;dueAt:Date|null;maxAttempts:number},
 input:{title:string;description:string|null;dueAt:string|null;maxAttempts:number},
):boolean {
 const dueTime=input.dueAt===null?null:new Date(input.dueAt).getTime();
 return current.title===input.title &&
  current.description===input.description &&
  (current.dueAt?.getTime()??null)===dueTime &&
  current.maxAttempts===input.maxAttempts;
}

/** Attempt limits are part of a published Quiz's announced conditions.
 * Only an unpublished draft may revise them. */
export function facultyQuizAttemptLimitLocked(
 status:"DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED",
 persisted:number,requested:number,
){
 return status!=="DRAFT" && persisted!==requested;
}
