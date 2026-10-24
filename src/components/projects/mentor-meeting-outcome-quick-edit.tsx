"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {projectMutation} from "./project-api";

/** The completed-meeting outcome is the only field writable through the
 * dedicated notes API. Structured attendance/actions remain in the project
 * meeting editor until a compatible version-checked endpoint is available.
 */
export function MentorMeetingOutcomeQuickEdit({projectId,meetingId,recorded,
  updatedAt,editable}:{
 projectId:string;meetingId:string;recorded:string|null;
 updatedAt:string|null;editable:boolean;
}){
 const router=useRouter();
 const [editing,setEditing]=useState(false);
 const [text,setText]=useState(recorded??"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 if(!editable||!updatedAt)return null;
 async function save(){
  if(busy||!text.trim()||text.trim()===(recorded??"").trim())return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
     "/meetings/"+encodeURIComponent(meetingId)+"/mentor-notes","PATCH",{
       outcome:text.trim(),expectedUpdatedAt:updatedAt,confirmed:true,
     });
   setEditing(false);router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:
     "Meeting notes could not be saved. Reload the latest meeting before retrying.");
  }finally{setBusy(false);}
 }
 return <div className="space-y-2 border-t border-border pt-3">
   {!editing?<Button variant="secondary" size="sm" type="button"
      onClick={()=>{setText(recorded??"");setError("");setEditing(true);}}>
      {recorded?"Edit recorded outcome":"Record meeting outcome"}
     </Button>:<>
     <label className="block text-sm font-semibold">
       Outcome notes shared with the team
       <Textarea className="mt-1" rows={4} maxLength={4000} disabled={busy}
         value={text} onChange={event=>setText(event.target.value)}/>
     </label>
     {error?<p role="alert" className="text-error">{error}</p>:null}
     <div className="flex gap-2">
       <Button type="button" disabled={busy||!text.trim()||
         text.trim()===(recorded??"").trim()} loading={busy}
         onClick={()=>void save()}>Save outcome</Button>
       <Button type="button" variant="secondary" disabled={busy}
         onClick={()=>setEditing(false)}>Cancel</Button>
     </div>
   </>}
 </div>;
}
