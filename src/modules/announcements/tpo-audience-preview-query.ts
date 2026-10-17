import {z} from "zod";
import {tpoPlacementAudienceSchema} from "./tpo-placement-audience-model";
const uuid=z.string().uuid();
export const tpoAudiencePreviewQuery=z.object({
  audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("COLLEGE"),
  targetId:uuid.optional(),
  targetIds:z.array(uuid).max(50).optional(),
}).strict().superRefine((value,ctx)=>{
  const grouped=value.audience==="BATCHES"||value.audience==="BRANCHES";
  const targets=value.targetIds??[];
  if(grouped && targets.length===0 && !value.targetId)
   ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose at least one audience target"});
  if(grouped && targets.length>0 && value.targetId)
   ctx.addIssue({code:"custom",path:["targetId"],message:"Select targets in one format"});
  if(new Set(targets).size!==targets.length)
   ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose distinct audience targets"});
  if(value.audience==="DRIVE"&&!value.targetId)
   ctx.addIssue({code:"custom",path:["targetId"],message:"Choose an audience target"});
  if((value.audience==="COLLEGE"||value.audience==="PLACEMENTS")&&
   (value.targetId||targets.length>0))
   ctx.addIssue({code:"custom",path:["targetId"],message:"Unexpected audience target"});
  if(!grouped&&targets.length)
   ctx.addIssue({code:"custom",path:["targetIds"],message:"Unexpected audience targets"});
});

export function announcementPreviewScope(raw:unknown){
 const parsed=tpoAudiencePreviewQuery.parse(raw);
 if(parsed.audience==="COLLEGE")return null;
 const kind=parsed.audience;
 const ids=parsed.targetIds?.length?parsed.targetIds:parsed.targetId?[parsed.targetId]:[];
 const value=kind==="PLACEMENTS"?{kind}:
    kind==="BATCHES"?{kind,cohortIds:ids}:
    kind==="BRANCHES"?{kind,departmentIds:ids}:
    {kind:"DRIVE",jobId:parsed.targetId};
 return tpoPlacementAudienceSchema.parse(value);
}
