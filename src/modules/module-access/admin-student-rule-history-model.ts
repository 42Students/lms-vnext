import {z} from "zod";
type RuleState={enabled:boolean;locked:boolean}|null;
function parseState(value:unknown):RuleState|undefined{
 if(value===null)return null;
 if(!value||typeof value!=="object"||!("enabled" in value)||!("locked" in value))return undefined;
 return typeof value.enabled==="boolean"&&typeof value.locked==="boolean"
  ?{enabled:value.enabled,locked:value.locked}:undefined;
}
function stateLabel(state:RuleState|undefined):string{
 if(state===undefined)return "Unknown previous value";
 if(state===null)return "Inherit";
 return (state.enabled?"On":"Off")+(state.locked?" · Locked":"");
}
/** Never serialize actor email or arbitrary event metadata into the browser. */
export function safeStudentRuleHistory(rows:readonly {
 id:string;occurredAt:Date;summary:string;actorName:string|null;
 metadata:Record<string,unknown>
}[]){
 return rows.map(row=>{
  const moduleName=["projects","electives"].includes(String(row.metadata.module))
   ?String(row.metadata.module):"Optional module";
  const before=parseState(row.metadata.before),after=parseState(row.metadata.after);
  return {id:row.id,occurredAt:row.occurredAt,actorName:row.actorName||"Unknown actor",
   module:moduleName,change:stateLabel(before)+" → "+stateLabel(after)};
 });
}

export const studentRuleHistoryCursorSchema=z.strictObject({
 beforeOccurredAt:z.iso.datetime({offset:true}).optional(),
 beforeId:z.uuid().optional(),
 module:z.enum(["all","projects","electives"]).default("all"),
 actorName:z.string().trim().max(100).default(""),
 from:z.union([z.literal(""),z.iso.date()]).default(""),
 to:z.union([z.literal(""),z.iso.date()]).default(""),
}).refine(value=>Boolean(value.beforeOccurredAt)===Boolean(value.beforeId),{
 message:"Both pagination cursor fields are required",
}).refine(value=>!value.from||!value.to||value.from<=value.to,{
 message:"History start cannot be later than end",path:["to"],
});
export function studentRuleHistoryHref(collegeId:string,membershipId:string,
 next:{beforeOccurredAt:Date;beforeId:string}|null,module:"all"|"projects"|"electives"="all",actorName="",from="",to=""){
 const base="/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)+"/history";
 const query=new URLSearchParams();
 if(module!=="all")query.set("module",module);
 if(actorName.trim())query.set("actorName",actorName.trim());
 if(from)query.set("from",from);
 if(to)query.set("to",to);
 if(next){query.set("beforeOccurredAt",next.beforeOccurredAt.toISOString());query.set("beforeId",next.beforeId);}
 return query.size?base+"?"+query.toString():base;
}

/** Reuse exactly the same validated, college-scoped filters for the CSV page export. */
export function studentRuleHistoryExportHref(collegeId:string,membershipId:string,
 cursor:{beforeOccurredAt:Date;beforeId:string}|null,module:"all"|"projects"|"electives",
 actorName:string,from:string,to:string){
 return studentRuleHistoryHref(collegeId,membershipId,cursor,module,actorName,from,to)
  .replace("/history","/history/export");
}
