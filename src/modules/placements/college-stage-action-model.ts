import {z} from "zod";
export const COLLEGE_APPLICATION_STAGES=[
 "APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED",
] as const;
export const collegeStageCommandSchema=z.object({
 action:z.enum(["MOVE","REINSTATE"]),
 applicationIds:z.array(z.string().uuid()).min(1).max(100).refine(ids=>new Set(ids).size===ids.length,
  "Duplicate applications are not allowed"),
 stage:z.enum(COLLEGE_APPLICATION_STAGES).optional(),
 reason:z.string().trim().min(3).max(1000),
 notifyByEmail:z.boolean().default(false),
 confirmed:z.literal(true),
}).strict().superRefine((v,ctx)=>{
 if(v.action==="MOVE"&&!v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Choose a new application stage"});
 if(v.action==="REINSTATE"&&v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Reinstate uses the previous stage"});
});
export type CollegeStageCommand=z.infer<typeof collegeStageCommandSchema>;

/** Legacy row-level moves; terminal placement facts must still be verified in service. */
export const COLLEGE_APPLICATION_TRANSITIONS: Record<string,readonly string[]>={
 APPLIED:["SHORTLISTED","ASSESSMENT","REJECTED"],
 SHORTLISTED:["ASSESSMENT","INTERVIEW","WAITLISTED","REJECTED"],
 ASSESSMENT:["INTERVIEW","WAITLISTED","REJECTED"],
 INTERVIEW:["WAITLISTED","OFFERED","REJECTED"],
 WAITLISTED:["OFFERED","REJECTED"],
 OFFERED:["HIRED","REJECTED"],
 HIRED:[], REJECTED:[],
};
