"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {projectMutation} from "./project-api";
import {mentorMeetingFacilitationSchema,
 type MentorMeetingFacilitation} from
 "@/modules/projects/mentor-meeting-facilitation-model";

type Fields=Partial<MentorMeetingFacilitation>;

/** Only a completed meeting in an active project can be edited. The API
 * independently checks recipient, active college membership, role,
 * project ownership, terminal meeting state and updatedAt.
 */
export function MentorMeetingFacilitationQuickEdit({projectId,meetingId,
 updatedAt,recorded,editable}:{
 projectId:string;meetingId:string;updatedAt:string|null;
 recorded:Fields|undefined;editable:boolean;
}){
 const router=useRouter();
 const initial=mentorMeetingFacilitationSchema.parse(recorded??{});
 const [editing,setEditing]=useState(false);
 const [facilitation,setFacilitation]=useState(initial);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 if(!editable||!updatedAt)return null;
 const dirty=JSON.stringify(facilitation)!==JSON.stringify(initial);
 const update=(key:keyof Pick<MentorMeetingFacilitation,
  "notes"|"wentWell"|"retroDidntGoWell"|"improve"|"nextTime"|"followUpNotes">,
  value:string)=>setFacilitation(old=>({...old,[key]:value}));
 async function save(){
  if(busy||!dirty)return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
     "/meetings/"+encodeURIComponent(meetingId)+"/facilitation","PATCH",{
     facilitation,expectedUpdatedAt:updatedAt,confirmed:true,
   });
   setEditing(false);router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:
    "Could not save completed-meeting notes. Reload the latest meeting.");
  }finally{setBusy(false);}
 }
 return <section aria-label="Completed meeting notes and attendance edit"
  className="space-y-3 border-t border-border pt-3">
  {!editing?<Button type="button" size="sm" variant="secondary"
    onClick={()=>{setFacilitation(initial);setError("");setEditing(true);}}>
    Edit attendance, retrospective and action items
  </Button>:<>
   <h4 className="font-semibold">Edit completed meeting record</h4>
   {([
     ["notes","Meeting notes"],["wentWell","Went well"],
     ["retroDidntGoWell","Didn't go well"],["improve","Could improve"],
     ["nextTime","Next sprint actions"],["followUpNotes","Follow-up notes"],
   ] as const).map(([key,label])=><label key={key}
     className="block text-sm font-semibold">
      {label}
      <Textarea rows={2} maxLength={4000} disabled={busy}
        className="mt-1" value={facilitation[key]}
        onChange={event=>update(key,event.target.value)}/>
   </label>)}
   {facilitation.attendees.length>0?<fieldset className="space-y-2">
    <legend className="font-semibold">Who attended?</legend>
    {facilitation.attendees.map((person,index)=><label key={person.membershipId??index}
      className="flex items-center gap-2">
      <input type="checkbox" checked={person.attended} disabled={busy}
        onChange={event=>setFacilitation(old=>({...old,
          attendees:old.attendees.map((entry,i)=>i===index?{
            ...entry,attended:event.target.checked}:entry),
        }))}/>
      <span>{person.name}</span>
    </label>)}
   </fieldset>:<p>No attendee list was recorded. Add attendees in the
     full project meeting editor before marking attendance.</p>}
   {facilitation.actionItemRows.length>0?<fieldset className="space-y-2">
     <legend className="font-semibold">Action items</legend>
     {facilitation.actionItemRows.map((item,index)=><div key={index}
       className="flex flex-wrap items-center gap-2">
       <label className="flex items-center gap-2">
        <input type="checkbox" checked={item.complete} disabled={busy}
         aria-label={"Completed: "+item.text}
         onChange={event=>setFacilitation(old=>({...old,
          actionItemRows:old.actionItemRows.map((entry,i)=>i===index?
            {...entry,complete:event.target.checked}:entry),
         }))}/>
        <span>{item.text}</span>
       </label>
       <label className="text-sm">Owner
        <input type="text" maxLength={160} disabled={busy}
         className="ml-2 rounded border border-border p-2"
         value={item.owner??""}
         onChange={event=>setFacilitation(old=>({...old,
          actionItemRows:old.actionItemRows.map((entry,i)=>i===index?
            {...entry,owner:event.target.value||null}:entry),
         }))}/>
       </label>
     </div>)}
   </fieldset>:null}
   <label className="block text-sm font-semibold">
     Follow-up state
     <select value={facilitation.followUpStatus} disabled={busy}
       className="ml-2 rounded border border-border p-2"
       onChange={event=>setFacilitation(old=>({...old,
         followUpStatus:event.target.value as MentorMeetingFacilitation["followUpStatus"],
       }))}>
       {["NOT_PLANNED","OPEN","IN_PROGRESS","DONE","BLOCKED"].map(value=>
        <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
     </select>
   </label>
   <p className="text-xs text-muted-foreground">Saving changes records an
     auditable event. The meeting time, invitation status and outcome text are
     not modified by this form.</p>
   {error?<p role="alert" className="text-error">{error}</p>:null}
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={busy||!dirty} loading={busy}
      onClick={()=>void save()}>Save meeting notes</Button>
    <Button type="button" variant="secondary" disabled={busy}
      onClick={()=>{setEditing(false);setError("");}}>Cancel</Button>
   </div>
  </>}
 </section>;
}
