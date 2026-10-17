/** Legacy TPO follow-up text: never display private API codes in the UI. */
export type TpoFollowupAction="ADD"|"MOVE"|"DONE";
export function tpoCalendarFollowupSuccess(action:TpoFollowupAction):string{
 return action==="ADD"?"Follow-up added":action==="MOVE"?"Follow-up moved":"Follow-up marked done";
}
export function tpoCalendarFollowupError(action:TpoFollowupAction,code:string|null):string{
 if(code==="TPO_CRM_FOLLOWUP_ALREADY_DONE")return "Could not move it";
 if(code==="DB09_MIGRATIONS_PENDING")return "Follow-up was not saved";
 return action==="MOVE"?"Could not move it":action==="DONE"?"Could not mark it done":"Could not save the follow-up";
}
