/** Visible Mentor resources grouped without changing task/resource identity or
 * dropping scoped rows. Reordering remains a separate full-list operation.
 */
export type MentorResourceForSection={
 id:string;pinned?:boolean;sprintId?:string|null;
};
export type MentorResourceSprintSection={
 id:string;label:string;status?:string;
};
export type MentorResourceSection<T>={id:string;title:string;rows:T[]};
export function groupMentorResourcesBySprint<T extends MentorResourceForSection>(
 rows:readonly T[],sprints:readonly MentorResourceSprintSection[],
):MentorResourceSection<T>[] {
 const sprintById=new Map(sprints.map((s,i)=>[s.id,{...s,order:i}] as const));
 const known=new Map<string,MentorResourceSection<T>>();
 const slot=(id:string,title:string)=>{
  let value=known.get(id);
  if(!value){value={id,title,rows:[]};known.set(id,value);}
  return value;
 };
 for(const row of rows){
  if(row.pinned){slot("PINNED","Pinned references").rows.push(row);continue;}
  const sprint=row.sprintId?sprintById.get(row.sprintId):null;
  if(!sprint){
   slot(row.sprintId?"UNKNOWN":"PROJECT",row.sprintId?
     "Unmapped sprint resources":"Whole project").rows.push(row);
   continue;
  }
  slot("SPRINT:"+sprint.id,sprint.label+" · "+sprint.status?.replaceAll("_"," ")??"")
   .rows.push(row);
 }
 const sortKey=(section:MentorResourceSection<T>)=>{
  if(section.id==="PINNED")return -20000;
  if(section.id==="PROJECT")return 10000;
  if(section.id==="UNKNOWN")return 20000;
  const sprint=sprintById.get(section.id.slice("SPRINT:".length));
  if(!sprint)return 15000;
  return sprint.status==="ACTIVE"?0:
    sprint.status==="PLANNED"?100+sprint.order:
    1000+sprint.order;
 };
 return [...known.values()].sort((a,b)=>sortKey(a)-sortKey(b)||
   a.id.localeCompare(b.id));
}
