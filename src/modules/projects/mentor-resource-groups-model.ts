export type MentorResourceGroupSprint={id:string;label:string;status?:string};
export type MentorResourceGroupRow={id:string;sprintId?:string|null;
 pinned?:boolean;sequence:number};
export function mentorResourceGroupKey(
 row:MentorResourceGroupRow,bySprint:boolean,
 sprints:readonly MentorResourceGroupSprint[],
):string{
 if(row.pinned)return "PINNED";
 if(!bySprint)return "OTHER";
 if(!row.sprintId)return "WHOLE";
 return sprints.some(s=>s.id===row.sprintId)?"SPRINT:"+row.sprintId:"UNKNOWN";
}
export function mentorResourceGroupLabel(
 key:string,sprints:readonly MentorResourceGroupSprint[],
):string{
 if(key==="PINNED")return "Pinned references";
 if(key==="WHOLE")return "Whole project";
 if(key==="OTHER")return "Other resources";
 if(key==="UNKNOWN")return "Unlinked historical sprint";
 return sprints.find(s=>key==="SPRINT:"+s.id)?.label??"Unlinked sprint";
}
export function mentorResourceGroupOrder<T extends MentorResourceGroupRow>(
 rows:readonly T[],sprints:readonly MentorResourceGroupSprint[],
):T[]{
 const groups=[...sprints].sort((a,b)=>{
  const weight=(status:string|undefined)=>status==="ACTIVE"?0:
    status==="PLANNED"?1:status==="COMPLETED"?2:3;
  return weight(a.status)-weight(b.status)||
    sprints.indexOf(a)-sprints.indexOf(b);
 }).map(s=>s.id);
 const rank=(row:T)=>{
  if(row.pinned)return 0;
  if(!row.sprintId)return groups.length+1;
  const index=groups.indexOf(row.sprintId);
  return index<0?groups.length+2:index+1;
 };
 return [...rows].sort((a,b)=>rank(a)-rank(b)||a.sequence-b.sequence||
   a.id.localeCompare(b.id));
}
