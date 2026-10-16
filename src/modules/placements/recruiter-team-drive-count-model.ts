/** REC-calendar-messages-profile-34: display only data of the active
 * employer-college relationship. Requests with an approved job are counted
 * once even if the same job was recruiter-authored. */
export function recruiterTeamDriveCounts(
 team:readonly {userId:string}[],
 jobs:readonly {id:string;createdByUserId:string}[],
 requests:readonly {id:string;recruiterUserId:string;approvedJobId:string|null}[],
):Map<string,number>{
 const byUser=new Map<string,Set<string>>(team.map(member=>[member.userId,new Set<string>()] as const));
 for(const job of jobs)byUser.get(job.createdByUserId)?.add("job:"+job.id);
 for(const req of requests)byUser.get(req.recruiterUserId)?.add(
  req.approvedJobId?"job:"+req.approvedJobId:"request:"+req.id);
 return new Map([...byUser.entries()].map(([id,ids])=>[id,ids.size]));
}
export function hrTeamAvatarInitial(name:string|null,email:string|null):string{
 return (name?.trim()||email?.trim()||"R").slice(0,1).toLocaleUpperCase("en");
}
