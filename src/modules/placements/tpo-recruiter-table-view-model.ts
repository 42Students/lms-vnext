export const ENGAGE_COLUMNS = ["Contact","Status","Stage","Company","Designation","Email","Phone",
 "Flags","Owner","Last activity","Next follow-up","Invite","Added","Came from",
 "Company drives","Students placed","Actions"] as const;
export type EngageColumn = (typeof ENGAGE_COLUMNS)[number];
export const ENGAGE_DEFAULT_COLUMNS: readonly EngageColumn[] = ENGAGE_COLUMNS.filter(x=>
 !["Designation","Email","Phone","Added"].includes(x));
export type EngageSort = "ADDED"|"LAST_ACTIVITY"|"NEXT_FOLLOWUP"|"NAME"|"DRIVES";
export function normalizeEngageColumns(value:unknown): EngageColumn[]{
 if(!Array.isArray(value))return [...ENGAGE_DEFAULT_COLUMNS];
 const migrated=value.map((x:unknown)=>x==="Source"?"Came from":x);
 const selected=ENGAGE_COLUMNS.filter(x=>migrated.includes(x));
 return selected.includes("Contact")?selected:[...ENGAGE_DEFAULT_COLUMNS];
}
export function sortEngageRows<T extends {id:string;name:string;createdAt:string;
 lastActivityAt:string|null;nextFollowupAt:string|null;drivesRan?:number|null}>(
 rows:readonly T[],by:EngageSort,ascending:boolean):T[]{
 const dateValue=(row:T)=>by==="ADDED"?row.createdAt:
  by==="LAST_ACTIVITY"?row.lastActivityAt:row.nextFollowupAt;
 return [...rows].sort((a,b)=>{
  if(by==="NAME")return (ascending?1:-1)*a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  if(by==="DRIVES"){
   const x=a.drivesRan,y=b.drivesRan;
   if(x==null&&y==null)return a.id.localeCompare(b.id);
   if(x==null)return 1;
   if(y==null)return -1;
   return (ascending?1:-1)*(x-y)||a.id.localeCompare(b.id);
  }
  const x=dateValue(a),y=dateValue(b);
  if(!x&&!y)return a.id.localeCompare(b.id);
  if(!x)return 1;
  if(!y)return -1;
  const difference=new Date(x).getTime()-new Date(y).getTime();
  return (ascending?1:-1)*difference||a.id.localeCompare(b.id);
 });
}
