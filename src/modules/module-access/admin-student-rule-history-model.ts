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
  const module=["projects","electives"].includes(String(row.metadata.module))
   ?String(row.metadata.module):"Optional module";
  const before=parseState(row.metadata.before),after=parseState(row.metadata.after);
  return {id:row.id,occurredAt:row.occurredAt,actorName:row.actorName||"Unknown actor",
   module,change:stateLabel(before)+" → "+stateLabel(after)};
 });
}
