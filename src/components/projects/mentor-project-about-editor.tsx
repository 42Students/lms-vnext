"use client";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {mentorOverviewEditSchema} from "@/modules/projects/mentor-overview-edit-model";
import {Button} from "@/components/ui/button";
export function MentorProjectAboutEditor({project}:{project:{
 id:string;summary:string|null;dueLabel:string|null;blocker:string|null;
 nextAction:string|null;updatedAt:Date|string;
}}){
 const router=useRouter();
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [summary,setSummary]=useState(project.summary??"");
 const [dueLabel,setDueLabel]=useState(project.dueLabel??"");
 const [blocker,setBlocker]=useState(project.blocker??"");
 const [nextAction,setNextAction]=useState(project.nextAction??"");
 const blank=(value:string)=>value.trim()||null;
 async function save(){
  const result=mentorOverviewEditSchema.safeParse({
   summary:blank(summary),dueLabel:blank(dueLabel),blocker:blank(blocker),
   nextAction:blank(nextAction),expectedUpdatedAt:new Date(project.updatedAt).toISOString(),
  });
  if(!result.success){setError("Check the field lengths before saving.");return;}
  if(busy)return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(project.id)+"/mentor-overview","PATCH",result.data);
   setEditing(false);router.refresh();
  }catch{
   setError("The project details could not be saved. Your edits are still here; reload the latest version if someone else changed it.");
  }finally{setBusy(false);}
 }
 return <section className="mt-3" aria-label="Edit about this project">
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>setEditing(v=>!v)}
   >
    {editing?"Close editor":"Edit details"}
  </Button>
  {editing?<div className="mt-3 space-y-3 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
   <h3 className="font-semibold">Edit about this project</h3>
   {([
    {label:"About this project",value:summary,change:setSummary,max:4000},
    {label:"Due date or milestone",value:dueLabel,change:setDueLabel,max:160},
    {label:"Next step",value:nextAction,change:setNextAction,max:4000},
    {label:"Requires attention",value:blocker,change:setBlocker,max:4000},
   ]).map(field=><label key={field.label} className="block text-sm font-semibold">{field.label}
    <Textarea className="mt-1 min-h-16 w-full"
     disabled={busy} maxLength={field.max} value={field.value} onChange={e=>field.change(e.target.value)}/>
   </label>)}
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   <div className="flex gap-2">
    <Button type="button" disabled={busy} onClick={()=>void save()}
     >
     {busy?"Saving…":"Save details"}
    </Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setEditing(false)}
     >Cancel</Button>
   </div>
  </div>:null}
 </section>;
}
