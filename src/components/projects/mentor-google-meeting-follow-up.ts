/** Run only AFTER an authorized local meeting mutation has committed.
 * Provider acceptance is not proof that an invitation was delivered.
 * A failed Google request must never undo or misrepresent the local decision.
 */
export async function mentorGoogleMeetingFollowUp(
 projectId:string,meetingId:string,action:"CANCEL"|"RESCHEDULE",
 fetchImpl:typeof fetch=fetch,
):Promise<boolean>{
 const path="/api/projects/"+encodeURIComponent(projectId)+
  "/meetings/"+encodeURIComponent(meetingId)+"/google";
 try{
  const response=await fetchImpl(path,{
   method:action==="CANCEL"?"DELETE":"POST",
   cache:"no-store",credentials:"same-origin",
   ...(action==="RESCHEDULE"?{
    headers:{"Content-Type":"application/json"},body:"{}",
   }:{}),
  });
  if(!response.ok)return false;
  const data=await response.json() as {
   removed?:boolean;meetingScheduled?:boolean;
   invitationStatus?:string;
  };
  return action==="CANCEL"?data.removed===true:
   data.meetingScheduled===true&&data.invitationStatus==="PROVIDER_ACCEPTED";
 }catch{return false;}
}
