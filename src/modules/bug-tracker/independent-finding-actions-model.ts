import {z} from "zod";
import {FINDING_STATUSES,FINDING_SEVERITIES} from "./independent-audit-findings-model";
const common=z.object({expectedVersion:z.number().int().min(0)});
const reason=z.string().trim().min(1).max(4000);
const comment=z.string().trim().min(1,"Write a comment").max(4000);
export const FINDING_COMMIT_REPOS=["lms","lms2-fe","both","infra","other","lms-vnext"] as const;
export const independentFindingActionSchema=z.discriminatedUnion("action",[
 common.extend({action:z.literal("STATUS"),status:z.enum(FINDING_STATUSES),note:reason.optional()}).superRefine((x,ctx)=>{
  if(["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"].includes(x.status)&&!x.note)
   ctx.addIssue({code:"custom",path:["note"],message:"A reason is required for this status"});
 }),
 common.extend({action:z.literal("SEVERITY"),severity:z.enum(FINDING_SEVERITIES)}),
 common.extend({action:z.literal("ASSIGNEE"),assignee:z.string().trim().min(1).max(100,"Keep the name under 100 characters").nullable()}),
 common.extend({action:z.literal("DUPLICATE"),duplicateOf:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/,"Choose the finding this repeats")}),
 common.extend({action:z.literal("FIX_COMMIT"),repo:z.enum(FINDING_COMMIT_REPOS,{error:"Unknown repo"}),sha:z.string().regex(/^[0-9a-f]{7,40}$/,"That isn't a commit hash")}),
 common.extend({action:z.literal("COMMENT"),note:comment}),
]);
export type IndependentFindingAction=z.infer<typeof independentFindingActionSchema>;
