import {z} from "zod";
export const hrRoundFormSchema=z.strictObject({
 action:z.enum(["CREATE","UPDATE","REMOVE"]),
 kind:z.enum(["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"]).optional(),
 name:z.string().trim().min(1).max(100).optional(),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]).optional(),
 durationMinutes:z.coerce.number().int().min(1).max(1440).optional(),
 roundId:z.string().uuid().optional(),
 expectedUpdatedAt:z.string().datetime({offset:true}).optional(),
}).superRefine((row,ctx)=>{
 if(row.action==="CREATE" && (!row.kind||!row.name))
  ctx.addIssue({code:"custom",message:"Round kind and name required"});
 if(row.action!=="CREATE" && (!row.roundId||!row.expectedUpdatedAt))
  ctx.addIssue({code:"custom",message:"Round identity and latest version required"});
 if(row.action==="UPDATE"&& !row.name&&!row.mode&&row.durationMinutes===undefined&&!row.kind)
  ctx.addIssue({code:"custom",message:"Nothing to update"});
});
export function canRecruiterEditRound(input:{
 status:string;createdByUserId:string;recruiterUserId:string;hasResults:boolean;
}):boolean{
 return input.status==="PENDING"&&input.createdByUserId===input.recruiterUserId&&!input.hasResults;
}
export function duplicateRecruiterRoundName(
 names:readonly {id:string;name:string;status:string}[],name:string,excludeId?:string,
):boolean{
 const canonical=name.trim().replace(/\s+/g," ").toLocaleLowerCase("en");
 return names.some(row=>row.id!==excludeId&&row.status!=="CANCELLED"&&
  row.name.trim().replace(/\s+/g," ").toLocaleLowerCase("en")===canonical);
}
