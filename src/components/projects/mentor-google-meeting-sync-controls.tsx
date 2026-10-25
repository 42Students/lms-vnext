"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import type {MentorGoogleMeetingStatus} from
 "@/modules/projects/mentor-google-calendar-status";
import {MentorGoogleMeetingProviderStatus} from "./mentor-google-meeting-provider-status";

export function MentorGoogleMeetingSyncControls({projectId,meetingId,canEdit,draft=false,cancelled=false}:{
 projectId:string;meetingId:string;canEdit:boolean;draft?:boolean;cancelled?:boolean;
}){
 const router=useRouter();
 const [status,setStatus]=useState<MentorGoogleMeetingStatus|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const [repeat,setRepeat]=useState("once");
 const [inviteMode,setInviteMode]=useState<"ALL"|"SELECTED">("ALL");
 const [inviteOptions,setInviteOptions]=useState<readonly {
  membershipId:string;displayName:string;
 }[]|null>(null);
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const endpoint="/api/projects/"+encodeURIComponent(projectId)+
  "/meetings/"+encodeURIComponent(meetingId)+"/google";
 async function selectInviteMode(next:"ALL"|"SELECTED"){
  setInviteMode(next);setError(null);setNotice(null);
  if(next!=="SELECTED"||inviteOptions!==null)return;
  setBusy(true);
  try{
   const response=await fetch(endpoint+"/invitees",{
    credentials:"same-origin",cache:"no-store",
   });
   if(!response.ok)throw new Error("Could not verify the current project roster.");
   const data=await response.json() as {
    members:readonly {membershipId:string;displayName:string}[];
   };
   setInviteOptions(data.members);
  }catch(e){
   setError(e instanceof Error?e.message:"Could not load current invitees.");
  }finally{setBusy(false);}
 }
 async function call(method:"GET"|"POST"|"DELETE"){
  if(busy)return;setBusy(true);setError(null);setNotice(null);
  try{
   const response=await fetch(endpoint,{
    method,credentials:"same-origin",cache:"no-store",
    ...(method==="POST"?{headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      ...(repeat==="once"?{}:{weeklyCount:Number(repeat)}),
      ...(inviteMode==="SELECTED"?{inviteeMembershipIds:selectedIds}:{}),
     })}:{})
   });
   if(!response.ok)throw new Error(response.status===403?
     "Your Mentor permission or Google consent is no longer active.":
     response.status===409?"Meeting details changed; refresh before syncing.":
     "The Google Calendar provider could not verify this meeting.");
   const json=await response.json() as MentorGoogleMeetingStatus|{
     providerStatus:MentorGoogleMeetingStatus|null;
     meetingScheduled?:boolean;
     invitationStatus?:"NOT_SENT"|"RETRY_REQUIRED"|"PROVIDER_ACCEPTED";
     removed?:boolean;
   };
   const next="providerStatus" in json?json.providerStatus:json;
   setStatus(next);
   if(method==="DELETE"&&"removed" in json&&json.removed){
    setNotice("Google accepted the event removal. Verify again to confirm its current provider state.");
    router.refresh();
   }
   if(method==="POST"&&"meetingScheduled" in json){
    setNotice(!json.meetingScheduled?
      "Google Meet creation is pending. The meeting stays a draft; no invitations were requested. Retry sync.":
      json.invitationStatus==="RETRY_REQUIRED"?
      "Meeting scheduled with a verified Meet link, but invitations need another sync attempt.":
      "Google accepted the event and invitee update. Delivery and RSVP still require verification.");
    router.refresh();
   }
  }catch(e){setError(e instanceof Error?e.message:"Provider verification failed.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Live Google Calendar event controls"
   className="space-y-2">
   <p className="text-xs text-muted-foreground">
     Invitees come only from active college-scoped project members with saved
     email addresses. A draft first obtains its private Meet link; after the
     meeting is saved as scheduled, Google receives the team invitation update.
   </p>
   {canEdit&&!cancelled?<div className="flex flex-wrap items-center gap-2">
    <label className="text-sm">Repeat
     <select value={repeat} disabled={busy}
      onChange={e=>setRepeat(e.target.value)}
      className="ml-2 rounded border border-border bg-background p-2">
      <option value="once">Once</option>
      <option value="4">Weekly × 4</option>
      <option value="8">Weekly × 8</option>
     </select>
    </label>
    <label className="text-sm">Invite
     <select value={inviteMode} disabled={busy}
      onChange={e=>void selectInviteMode(e.target.value as "ALL"|"SELECTED")}
      className="ml-2 min-h-11 rounded border border-border bg-background p-2">
      <option value="ALL">Whole active team</option>
      <option value="SELECTED">Selected active members</option>
     </select>
    </label>
    <Button size="sm" type="button" disabled={busy||
      inviteMode==="SELECTED"&&(!inviteOptions||selectedIds.length===0)}
      loading={busy} onClick={()=>void call("POST")}>
       {draft?"Generate Meet link and schedule":"Sync to Google and invite team"}
    </Button>
   </div>:null}
   {canEdit&&!cancelled&&inviteMode==="SELECTED"?
    <fieldset className="space-y-1 rounded border border-border p-3"
      disabled={busy} aria-label="Select verified project invitees">
      <legend className="px-1 text-sm font-semibold">Members to invite</legend>
      {inviteOptions===null?
        <p role="status" className="text-sm">Loading current eligible members, or retry selection.</p>:
       inviteOptions.length===0?
        <p className="text-sm">No members with saved email addresses are available.</p>:
        inviteOptions.map(person=><label key={person.membershipId}
          className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-5"
            checked={selectedIds.includes(person.membershipId)}
            onChange={e=>setSelectedIds(ids=>e.target.checked?
              [...ids,person.membershipId]:ids.filter(id=>id!==person.membershipId))}/>
          {person.displayName}
        </label>)}
    </fieldset>:null}
   {canEdit&&cancelled?<Button size="sm" variant="secondary" type="button"
     disabled={busy} loading={busy} onClick={()=>void call("DELETE")}>
     Remove cancelled event from Google
   </Button>:null}
   <Button size="sm" variant="secondary" type="button"
     disabled={busy} onClick={()=>void call("GET")}>
     Verify Google event and RSVPs
   </Button>
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {status?<MentorGoogleMeetingProviderStatus status={status}/>:null}
 </section>;
}
