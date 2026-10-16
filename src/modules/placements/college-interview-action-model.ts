import {z} from "zod";
const id=z.string().uuid();
const appointment=z.object({
 roundId:id,applicationId:id,scheduledAt:z.iso.datetime({offset:true}),
 durationMinutes:z.number().int().min(5).max(480),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),venue:z.string().trim().max(400).nullable(),
 meetingUrl:z.url().max(2000).nullable(),interviewer:z.string().trim().max(200).nullable(),
}).strict().superRefine((x,c)=>{
 if(x.mode==="ON_CAMPUS"&&(!x.venue||x.venue.length<2))
  c.addIssue({code:"custom",path:["venue"],message:"Enter the interview location."});
 if(x.mode==="VIRTUAL"&&(!x.meetingUrl||!/^https:\/\//i.test(x.meetingUrl)))
  c.addIssue({code:"custom",path:["meetingUrl"],message:"Enter a secure interview meeting URL."});
});
export const collegeInterviewActionSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("SCHEDULE"),confirmed:z.literal(true),appointment}).strict(),
 z.object({action:z.literal("EDIT"),confirmed:z.literal(true),interviewId:id,expectedVersion:z.number().int().positive(),
  appointment,reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.enum(["CANCEL","COMPLETED","NO_SHOW"]),confirmed:z.literal(true),
  interviewId:id,expectedVersion:z.number().int().positive(),reason:z.string().trim().min(3).max(500)}).strict(),
]);
