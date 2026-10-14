/** Persisted instants are ISO; datetime-local controls show device-local wall time. */
export function authoringLocalDateTime(instant:string|null):string{
 if(!instant)return "";
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime()))return "";
 const pad=(n:number)=>String(n).padStart(2,"0");
 return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+
   "T"+pad(date.getHours())+":"+pad(date.getMinutes());
}
export function authoringDueInstant(local:string):string|null{
 if(!local)return null;
 // Reject invalid datetime-local values before JSON serialization.
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
   throw new Error("Choose a valid local due date.");
 const date=new Date(local);
 if(!Number.isFinite(date.getTime())||authoringLocalDateTime(date.toISOString())!==local)
   throw new Error("Choose a valid local due date.");
 return date.toISOString();
}
export function assignmentActionAvailable(status:string|null,action:"CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE"){
 if(action==="CREATE")return status===null;
 if(status===null||status==="ARCHIVED")return false;
 if(action==="EDIT"||action==="PUBLISH")return status==="DRAFT";
 return status==="DRAFT"||status==="PUBLISHED";
}
