import {z} from "zod";
import {tpoPlacementAudienceSchema} from "./tpo-placement-audience-model";
const uuid=z.string().uuid();
export const tpoAudiencePreviewQuery=z.object({
  audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("COLLEGE"),
  targetId:uuid.optional(),
}).strict().superRefine((value,ctx)=>{
  if(["BATCHES","BRANCHES","DRIVE"].includes(value.audience) && !value.targetId) {
    ctx.addIssue({code:"custom",path:["targetId"],message:"Choose an audience target"});
  }
  if(["COLLEGE","PLACEMENTS"].includes(value.audience) && value.targetId) {
    ctx.addIssue({code:"custom",path:["targetId"],message:"Unexpected audience target"});
  }
});

export function announcementPreviewScope(raw:unknown){
  const parsed=tpoAudiencePreviewQuery.parse(raw);
  if(parsed.audience==="COLLEGE")return null;
  const kind=parsed.audience;
  const value=kind==="PLACEMENTS"?{kind}:
    kind==="BATCHES"?{kind,cohortIds:[parsed.targetId]}:
    kind==="BRANCHES"?{kind,departmentIds:[parsed.targetId]}:
    {kind:"DRIVE",jobId:parsed.targetId};
  return tpoPlacementAudienceSchema.parse(value);
}
