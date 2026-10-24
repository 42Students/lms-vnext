"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {projectMutation} from "./project-api";
type Response="ACCEPTED"|"TENTATIVE"|"DECLINED";
export function MentorMeetingRsvpControl({projectId,meetingId,
 expectedUpdatedAt,initialResponse,readOnly=false}:{
 projectId:string;meetingId:string;expectedUpdatedAt:string;
 initialResponse:Response|null;readOnly?:boolean;
}){
 const router=useRouter();
 const [current,setCurrent]=useState(initialResponse);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function respond(response:Response){
  if(pending||readOnly)return;
  setPending(true);setError(null);
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
    "/meetings/"+encodeURIComponent(meetingId)+"/rsvp","POST",{
     response,expectedUpdatedAt,
    });
   setCurrent(response);
   router.refresh();
  }catch(e){
   setError(e instanceof Error?e.message:"Could not save your meeting response.");
  }finally{setPending(false);}
 }
 return <section aria-label="Your in-app meeting response" className="mt-3 space-y-2">
  <p className="text-xs text-muted-foreground">
   RSVP recorded inside this project. This is not an external Google Calendar invitation.
  </p>
  {readOnly?<p>Your last recorded response: {current??"Not recorded"}</p>:
   <div className="flex flex-wrap gap-2" role="group" aria-label="Respond to meeting">
    {(["ACCEPTED","TENTATIVE","DECLINED"] as const).map(response=>
     <Button key={response} type="button" size="sm"
      variant={current===response?"primary":"secondary"}
      disabled={pending} loading={pending&&current!==response}
      aria-pressed={current===response}
      onClick={()=>void respond(response)}>
       {response==="ACCEPTED"?"Accept":response==="TENTATIVE"?"Maybe":"Decline"}
     </Button>)}
   </div>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
