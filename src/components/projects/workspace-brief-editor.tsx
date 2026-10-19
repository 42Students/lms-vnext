"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {workspaceBriefSchema,type WorkspaceBrief} from "@/modules/projects/workspace-brief-model";
export function WorkspaceBriefEditor({projectId,initial,updatedAt}:{
 projectId:string;initial:WorkspaceBrief;updatedAt:Date|string;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [goal,setGoal]=useState(initial.goal),[description,setDescription]=useState(initial.description),
 [deliverables,setDeliverables]=useState(initial.deliverables.join("\n")),
 [conditions,setConditions]=useState(initial.completionConditions.join("\n")),
 [personas,setPersonas]=useState(initial.personas.join("\n"));
 const lines=(text:string)=>text.split("\n").map(s=>s.trim()).filter(Boolean);
 async function save(){
  const parsed=workspaceBriefSchema.safeParse({
   goal,description,deliverables:lines(deliverables),completionConditions:lines(conditions),personas:lines(personas),
  });
  if(!parsed.success){setError(parsed.error.issues[0]?.message??"Invalid brief");return;}
  if(!window.confirm("Save workspace brief? These changes apply to this workspace only."))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/brief","PATCH",{
    brief:parsed.data,expectedUpdatedAt:new Date(updatedAt).toISOString(),
   });
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save workspace brief");}
  finally{setBusy(false);}
 }
 const field="mt-1 w-full";
 return <section aria-label="Edit project brief" className="mt-4 border-b border-border pb-5">
  <Button type="button" variant="secondary"
   onClick={()=>setOpen(v=>!v)}>{open?"Close brief editor":"Edit project brief"}</Button>
  {open?<div className="mt-3 grid gap-3">
   <label className="text-sm font-semibold">Project goal
    <Textarea maxLength={2000} value={goal} onChange={e=>setGoal(e.target.value)} className={field}/></label>
   <label className="text-sm font-semibold">Description
    <Textarea maxLength={4000} value={description} onChange={e=>setDescription(e.target.value)} className={field}/></label>
   {([{label:"Deliverables",value:deliverables,change:setDeliverables},
      {label:"Completion conditions",value:conditions,change:setConditions},
      {label:"Personas",value:personas,change:setPersonas}]).map(item=>
     <label key={item.label} className="text-sm font-semibold">{item.label} · one per line
      <Textarea value={item.value} onChange={e=>item.change(e.target.value)}
       className={field}/></label>)}
   <p className="text-xs text-muted-foreground">Up to 50 rows per group, 500 characters per row.</p>
   <div className="flex gap-2">
    <Button type="button" disabled={busy} onClick={()=>void save()}
      variant="primary">
      {busy?"Saving…":"Save brief"}</Button>
    <Button type="button" disabled={busy} onClick={()=>setOpen(false)}
      variant="secondary">Cancel</Button>
   </div>
  </div>:null}
  {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
 </section>;
}
