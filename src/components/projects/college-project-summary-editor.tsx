"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {collegeProjectStatusChangeAllowed} from "@/modules/projects/college-project-summary-model";
type Project={id:string;title:string;summary:string|null;status:string};
export function CollegeProjectSummaryEditor({project}:{project:Project}){
 const router=useRouter(),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [title,setTitle]=useState(project.title),[summary,setSummary]=useState(project.summary??""),
  [status,setStatus]=useState(project.status),[error,setError]=useState(""),[success,setSuccess]=useState("");
 async function save(){
  if(busy||!title.trim())return;
  if(!window.confirm("Save workspace summary changes?"))return;
  setBusy(true);setError("");setSuccess("");
  try{
   const res=await fetch("/api/projects/"+encodeURIComponent(project.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     title:title.trim(),summary:summary.trim()||null,status,
     expectedTitle:project.title,expectedSummary:project.summary,expectedStatus:project.status,
    }),
   });
   if(!res.ok){const payload=await res.json().catch(()=>({error:"Unable to save"}));
    throw new Error(payload.error||"Unable to save");}
   setSuccess("Workspace updated.");setOpen(false);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save");}
  finally{setBusy(false);}
 }
 return <section className="rounded border border-border bg-surface p-4">
  <button className="min-h-10 rounded border px-3 text-sm" type="button" onClick={()=>setOpen(value=>!value)}>
   Edit workspace summary</button>
  {open&&<div className="mt-3 grid gap-3">
   <label className="text-sm">Workspace title
    <input className="mt-1 w-full rounded border bg-background p-2" maxLength={200}
     value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="text-sm">Summary
    <textarea className="mt-1 w-full rounded border bg-background p-2" maxLength={4000}
     value={summary} onChange={e=>setSummary(e.target.value)}/></label>
   <label className="text-sm">Status
    <select className="mt-1 w-full rounded border bg-background p-2" value={status}
     onChange={e=>setStatus(e.target.value)}>
     <option value={project.status}>{project.status}</option>
     {project.status==="PLANNED"&&<option value="ACTIVE">Active</option>}
     {project.status==="ACTIVE"&&<option value="COMPLETED">Completed</option>}
    </select></label>
   <p className="text-xs text-muted-foreground">Activating requires a Mentor; completing requires an approved final submission.</p>
   <div className="flex gap-2"><button type="button" className="rounded bg-primary px-3 py-2 text-on-primary"
    disabled={busy||!title.trim()} onClick={()=>void save()}>{busy?"Saving…":"Save changes"}</button>
    <button type="button" className="rounded border px-3 py-2" disabled={busy}
     onClick={()=>setOpen(false)}>Cancel</button></div>
  </div>}
  {error&&<p role="alert" className="mt-2 text-error">{error}</p>}
  {success&&<p role="status" className="mt-2">{success}</p>}
 </section>;
}
