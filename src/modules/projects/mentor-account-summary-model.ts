export type MentorAssignedProject={
 id:string;courseLabel:string|null|undefined;memberRole:string;
 collegeId:string;
};
export function mentorAccountAssignments(
 rows:readonly MentorAssignedProject[],collegeId:string,
){
 const seen=new Set<string>();
 const authorized=rows.filter(row=>row.memberRole==="MENTOR"&&row.collegeId===collegeId)
  .filter(row=>{
   if(seen.has(row.id))return false;
   seen.add(row.id);return true;
  });
 const courses=[...new Set(authorized.map(row=>row.courseLabel?.trim())
  .filter((label):label is string=>Boolean(label)))].sort((a,b)=>a.localeCompare(b));
 return {teamCount:authorized.length,courses};
}
