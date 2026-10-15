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
}).refine(value=>Boolean(value.beforeOccurredAt)===Boolean(value.beforeId),{
 message:"Both pagination cursor fields are required",
});
export function studentRuleHistoryHref(collegeId:string,membershipId:string,
 next:{beforeOccurredAt:Date;beforeId:string}|null,module:"all"|"projects"|"electives"="all"){
 const base="/admin/features/"+encodeURIComponent(collegeId)+"/students/"+encodeURIComponent(membershipId)+"/history";
 const query=new URLSearchParams();
 if(module!=="all")query.set("module",module);
 if(next){query.set("beforeOccurredAt",next.beforeOccurredAt.toISOString());query.set("beforeId",next.beforeId);}
 return query.size?base+"?"+query.toString():base;
}
