import {z} from "zod";
export const mentorMeetingDecisionSchema=z.object({
 action:z.enum(["COMPLETE","CANCEL"]),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
 note:z.string().trim().max(2000).optional(),
 outcome:z.string().trim().max(4000).optional(),
}).strict().superRefine((v,ctx)=>{
 if(v.action==="COMPLETE"&&v.note!==undefined)ctx.addIssue({code:"custom",path:["note"],message:"Only cancellations accept a note"});
 if(v.action==="CANCEL"&&v.outcome!==undefined)ctx.addIssue({code:"custom",path:["outcome"],message:"Only completed meetings accept an outcome"});
});
export function mentorMeetingDecisionStatus(action:"COMPLETE"|"CANCEL",current:string){
 return action==="COMPLETE"?["SCHEDULED","RESCHEDULED"].includes(current):
   ["REQUESTED","SCHEDULED","RESCHEDULED"].includes(current);
}
