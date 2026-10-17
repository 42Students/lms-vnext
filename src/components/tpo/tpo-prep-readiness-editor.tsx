"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
export function TpoPrepReadinessEditor({choices,initial,expectedVersion}:{choices:readonly {id:string;name:string;code:string}[];
 initial:{courseIds:string[];minimumCompleted:number};expectedVersion:string}){
 const router=useRouter(),[selected,setSelected]=useState<string[]>(initial.courseIds),
 [minimum,setMinimum]=useState(initial.minimumCompleted),[busy,setBusy]=useState(false),
 [error,setError]=useState(""),[message,setMessage]=useState(""),[search,setSearch]=useState("");
 const dirty=JSON.stringify([...selected].sort())!==JSON.stringify([...initial.courseIds].sort())||minimum!==initial.minimumCompleted;
 useEffect(()=>{if(!dirty)return;const before=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",before);return ()=>window.removeEventListener("beforeunload",before);},[dirty]);
 async function save(){
  if(busy||minimum>selected.length)return;setBusy(true);setError("");setMessage("");
  try{
   await apiFetch("/api/placements/tpo/settings/prep-readiness",{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseIds:selected,minimumCompleted:minimum,expectedVersion})});
   setMessage("Readiness course policy saved.");router.refresh();
  }catch(e){setError(e instanceof FriendlyFetchError&&e.status===409?"This changed while you were working. Refresh and re-apply your edits.":e instanceof Error?e.message:"Unable to save readiness policy.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
  <h3 className="font-semibold">Required preparation courses</h3>
  <p className="text-sm text-muted-foreground">Select active courses from this college only. The readiness indicator is not yet derived from learner course completions.</p>
  <label className="block text-sm">Find a preparation course<input type="search" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100} placeholder="Search course name or code" className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
  <p className="text-xs text-muted-foreground">With none picked, nobody is marked as needing prep.</p>
  <fieldset disabled={busy} className="max-h-72 space-y-2 overflow-y-auto">
   <legend className="text-sm">Courses used for readiness</legend>
   {choices.filter(course=>(course.name+" "+course.code).toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))).map(course=><label key={course.id} className="flex min-h-10 min-w-0 items-center gap-2 rounded border border-border px-3 text-sm">
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
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
