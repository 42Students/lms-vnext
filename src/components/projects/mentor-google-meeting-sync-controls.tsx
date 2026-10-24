"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type {MentorGoogleMeetingStatus} from
 "@/modules/projects/mentor-google-calendar-status";
import {MentorGoogleMeetingProviderStatus} from "./mentor-google-meeting-provider-status";

export function MentorGoogleMeetingSyncControls({projectId,meetingId,canEdit}:{
 projectId:string;meetingId:string;canEdit:boolean;
}){
 const router=useRouter();
 const [status,setStatus]=useState<MentorGoogleMeetingStatus|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [repeat,setRepeat]=useState("once");
 const endpoint="/api/projects/"+encodeURIComponent(projectId)+
  "/meetings/"+encodeURIComponent(meetingId)+"/google";
 async function call(method:"GET"|"POST"){
  if(busy)return;setBusy(true);setError(null);
  try{
   const response=await fetch(endpoint,{
    method,credentials:"same-origin",cache:"no-store",
    ...(method==="POST"?{headers:{"Content-Type":"application/json"},
     body:JSON.stringify(repeat==="once"?{}:{weeklyCount:Number(repeat)})}:{})
   });
   if(!response.ok)throw new Error(response.status===403?
     "Your Mentor permission or Google consent is no longer active.":
     response.status===409?"Meeting details changed; refresh before syncing.":
     "The Google Calendar provider could not verify this meeting.");
   const json=await response.json() as
     MentorGoogleMeetingStatus|{providerStatus:MentorGoogleMeetingStatus};
   const next="providerStatus" in json?json.providerStatus:json;
   setStatus(next);
   if(method==="POST")router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Provider verification failed.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Live Google Calendar event controls"
   className="space-y-2">
   <p className="text-xs text-muted-foreground">
     Invitees come only from active college-scoped project members with saved
     email addresses. Google creates the actual Meet link and sends invite
     updates only after you request sync.
   </p>
   {canEdit?<div className="flex flex-wrap items-center gap-2">
    <label className="text-sm">Repeat
     <select value={repeat} disabled={busy}
      onChange={e=>setRepeat(e.target.value)}
      className="ml-2 rounded border border-border bg-background p-2">
      <option value="once">Once</option>
      <option value="4">Weekly × 4</option>
      <option value="8">Weekly × 8</option>
     </select>
    </label>
    <Button size="sm" type="button" disabled={busy}
      loading={busy} onClick={()=>void call("POST")}>
       Sync to Google and invite team
    </Button>
   </div>:null}
   <Button size="sm" variant="secondary" type="button"
     disabled={busy} onClick={()=>void call("GET")}>
     Verify Google event and RSVPs
   </Button>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {status?<MentorGoogleMeetingProviderStatus status={status}/>:null}
 </section>;
}
