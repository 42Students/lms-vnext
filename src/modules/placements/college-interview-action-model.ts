import {z} from "zod";
const id=z.string().uuid();
const appointment=z.object({
 roundId:id,applicationId:id,scheduledAt:z.iso.datetime({offset:true}),
 durationMinutes:z.number().int().min(5).max(480),
 // Legacy interview vocabulary; optional for already-versioned round clients.
 interviewType:z.enum(["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"],
  {error:"Please select interview type"}).optional(),
 roundDescription:z.string().trim().min(10,"Please add at least a short description (min 10 characters)")
  .max(500).optional(),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),venue:z.string().trim().max(500).nullable(),
 meetingUrl:z.url().max(500).nullable(),interviewer:z.string().trim().max(255).nullable(),
}).strict().superRefine((x,c)=>{
 if(x.mode==="ON_CAMPUS"&&(!x.venue||x.venue.length<2))
  c.addIssue({code:"custom",path:["venue"],message:"Enter the interview location."});
 if(x.mode==="VIRTUAL"&&!x.meetingUrl)
  c.addIssue({code:"custom",path:["meetingUrl"],message:"Please enter the meeting link"});
 else if(x.mode==="VIRTUAL"&&!/^https:\/\//i.test(x.meetingUrl??""))
  c.addIssue({code:"custom",path:["meetingUrl"],message:"Meeting link must be a valid https:// URL"});
});
export const collegeInterviewActionSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("SCHEDULE"),confirmed:z.literal(true),appointment}).strict(),
 z.object({action:z.literal("EDIT"),confirmed:z.literal(true),interviewId:id,expectedVersion:z.number().int().positive(),
  appointment,reason:z.string().trim().min(3).max(500)}).strict(),
 z.object({action:z.enum(["CANCEL","COMPLETED","NO_SHOW"]),confirmed:z.literal(true),
  interviewId:id,expectedVersion:z.number().int().positive(),reason:z.string().trim().min(3).max(500)}).strict(),
]);
