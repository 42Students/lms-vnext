"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoPrepReadinessEditor({choices,initial,expectedVersion}:{choices:readonly {id:string;name:string;code:string}[];
 initial:{courseIds:string[];minimumCompleted:number};expectedVersion:string}){
 const router=useRouter(),[selected,setSelected]=useState<string[]>(initial.courseIds),
 [minimum,setMinimum]=useState(initial.minimumCompleted),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[message,setMessage]=useState("");
 async function save(){
  if(busy||minimum>selected.length)return;setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/placements/tpo/settings/prep-readiness",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({courseIds:selected,minimumCompleted:minimum,expectedVersion}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(response.status===409?"Policy changed. Refresh to review the latest value.":data.error??"Unable to save readiness policy.");
   setMessage("Readiness course policy saved.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save readiness policy.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
  <h3 className="font-semibold">Required preparation courses</h3>
  <p className="text-sm text-muted-foreground">Select active courses from this college only. The readiness indicator is not yet derived from learner course completions.</p>
  <fieldset disabled={busy} className="max-h-72 space-y-2 overflow-y-auto">
   <legend className="text-sm">Courses used for readiness</legend>
   {choices.map(course=><label key={course.id} className="flex min-h-10 min-w-0 items-center gap-2 rounded border border-border px-3 text-sm">
    <input type="checkbox" checked={selected.includes(course.id)} onChange={e=>{
     setSelected(current=>e.target.checked?[...current,course.id]:current.filter(id=>id!==course.id));
    }}/><span className="min-w-0 break-words">{course.name} ({course.code})</span></label>)}
  </fieldset>
  <label className="block text-sm">Minimum completed courses
   <input type="number" min={0} max={selected.length} value={minimum} disabled={busy}
    onChange={e=>setMinimum(Number(e.target.value))}
    className="mt-1 min-h-11 w-28 rounded border border-border bg-surface px-3"/>
  </label>
  <button type="button" disabled={busy||minimum<0||minimum>selected.length||selected.length>40}
   onClick={()=>void save()} className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">
   {busy?"Saving…":"Save readiness policy"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
