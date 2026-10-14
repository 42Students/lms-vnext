import {z} from "zod";
import {createCourseQuizInputSchema} from "./quiz-validation";

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
 fields.extend({
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
