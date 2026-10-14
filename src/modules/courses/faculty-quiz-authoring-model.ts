import {z} from "zod";
import {createCourseQuizInputSchema, updateCourseQuizInputSchema} from "./quiz-validation";

export const facultyQuizParamsSchema=z.object({deliveryId:z.string().uuid()}).strict();
const fields=z.object({
 title:z.string().trim().min(1).max(255),
 description:z.string().trim().max(10000).nullable(),
 dueAt:z.iso.datetime({offset:true}).nullable(),
 maxAttempts:z.number().int().min(1).max(20),
 questions:createCourseQuizInputSchema.shape.questions,
}).strict();
export const facultyQuizCommandSchema=z.discriminatedUnion("action",[
 fields.extend({
  action:z.literal("CREATE"),
  lessonId:z.string().uuid(),sequence:z.number().int().min(0).max(10000),
  confirmed:z.literal(true),
 }),
 fields.omit({questions:true}).extend({
  questions:createCourseQuizInputSchema.shape.questions.optional(),
  action:z.literal("EDIT"),
  quizId:z.string().uuid(),expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmed:z.literal(true),
 }),
 z.object({
  action:z.enum(["PUBLISH","CLOSE","ARCHIVE"]),quizId:z.string().uuid(),
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
