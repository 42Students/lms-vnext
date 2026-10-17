import {z} from "zod";

/** Changing a frozen recipient snapshot is allowed only on a not-yet-sent,
 * future scheduled TPO notice. This model never widens an omitted audience
 * to COLLEGE as an accidental default. */
export const tpoNoticeAudienceChangeSchema=z.strictObject({
 audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]),
 targetId:z.string().uuid().optional(),
 targetIds:z.array(z.string().uuid()).max(50).optional(),
}).superRefine((data,ctx)=>{
 const grouped=data.audience==="BATCHES"||data.audience==="BRANCHES";
 const targets=data.targetIds??[];
 if(grouped&&targets.length===0)
  ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose an audience target"});
 if(new Set(targets).size!==targets.length)
  ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose distinct audience targets"});
 if(grouped&&data.targetId)
  ctx.addIssue({code:"custom",path:["targetId"],message:"Select targets in one format"});
 if(data.audience==="DRIVE"&&!data.targetId)
  ctx.addIssue({code:"custom",path:["targetId"],message:"Choose an audience target"});
 if(!grouped&&targets.length)
  ctx.addIssue({code:"custom",path:["targetIds"],message:"Unexpected audience target"});
 if(data.audience!=="DRIVE"&&!grouped&&data.targetId)
  ctx.addIssue({code:"custom",path:["targetId"],message:"Unexpected audience target"});
});
export type TpoNoticeAudienceChange=z.infer<typeof tpoNoticeAudienceChangeSchema>;

export function mayChangeTpoNoticeAudience(input:{
 scheduledAt:Date|null;now:Date;delivered:boolean;deleted:boolean;
}):boolean{
 return !input.deleted&&!input.delivered&&
  input.scheduledAt!==null&&input.scheduledAt.getTime()>input.now.getTime();
}
