"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {getTpoPrepSelectionState} from "@/modules/placements/tpo-prep-selection-model";

type PrepSaveResult={changed:boolean;updatedAt:string};
export function TpoPrepReadinessEditor({choices,initial,expectedVersion}:{choices:readonly {id:string;name:string;code:string}[];
 initial:{courseIds:string[];minimumCompleted:number};expectedVersion:string}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>(initial.courseIds);
 const [minimum,setMinimum]=useState(initial.minimumCompleted);
 const [saved,setSaved]=useState(initial);
 const [version,setVersion]=useState(expectedVersion);
 const [busy,setBusy]=useState(false);
 const submitting=useRef(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [search,setSearch]=useState("");
 const available=new Set(choices.map(row=>row.id));
 const {missing,dirty,valid}=getTpoPrepSelectionState(
  selected,saved,minimum,choices.map(row=>row.id),
 );
 useEffect(()=>{
  if(!dirty)return;
  const before=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",before);
  return ()=>window.removeEventListener("beforeunload",before);
 },[dirty]);
 async function save(){
  // The ref prevents two click/Enter submissions before React can render busy.
  if(submitting.current||!dirty||!valid)return;
  submitting.current=true;setBusy(true);setError("");setMessage("");
  try{
   const result=await apiFetch<PrepSaveResult>("/api/placements/tpo/settings/prep-readiness",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({courseIds:selected,minimumCompleted:minimum,expectedVersion:version}),
   });
   if(typeof result?.updatedAt==="string")setVersion(result.updatedAt);
   setSaved({courseIds:[...selected],minimumCompleted:minimum});
   setMessage("Readiness course policy saved.");
   router.refresh();
  }catch(e){
   setError(e instanceof FriendlyFetchError&&e.status===409
    ?"This changed while you were working. Refresh and re-apply your edits."
    :e instanceof FriendlyFetchError?e.message:"Unable to save readiness policy. Try again.");
  }finally{submitting.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 border-t border-border pt-4">
  <h3 className="font-semibold">Required preparation courses</h3>
  <p className="text-sm text-muted-foreground">Select active courses from this college only. TPO Students derives preparation support from saved learner course completions when published course evidence is available; missing progress remains unclassified.</p>
  <label className="block text-sm">Find a preparation course
   <Input type="search" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}
    placeholder="Search course name or code" className="mt-1 min-h-9 w-full"/>
  </label>
  <p className="text-xs text-muted-foreground">With none picked, nobody is marked as needing prep.</p>
  {missing.length>0?<p role="alert" className="rounded-[var(--lms-canvas-radius)] border border-warning-border bg-warning-subtle p-3 text-sm">
   {missing.length} previously selected preparation course(s) are no longer active or available in this college.
   Remove the unavailable selections before saving; the existing policy has not been changed.
   <Button type="button" variant="secondary" disabled={busy} onClick={()=>setSelected(current=>current.filter(id=>available.has(id)))}
    className="ml-2 min-h-9">Remove unavailable courses</Button>
  </p>:null}
  <fieldset disabled={busy} className="max-h-72 space-y-2 overflow-y-auto">
   <legend className="text-sm">Courses used for readiness</legend>
   {choices.filter(course=>(course.name+" "+course.code).toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))).map(course=>
    <label key={course.id} className="flex min-h-11 sm:min-h-9 min-w-0 items-center gap-2 rounded-[var(--lms-canvas-radius,12px)] border border-border px-3 text-sm">
     <Checkbox checked={selected.includes(course.id)} onChange={e=>{
      setSelected(current=>e.target.checked?current.includes(course.id)?current:[...current,course.id]:
       current.filter(id=>id!==course.id));
     }}/><span className="min-w-0 break-words">{course.name} ({course.code})</span>
    </label>)}
  </fieldset>
  <label className="block text-sm">Minimum completed courses
   <Input type="number" min={0} max={selected.length} value={minimum} disabled={busy}
    onChange={e=>setMinimum(Number(e.target.value))}
    className="mt-1 min-h-9 w-28"/>
  </label>
  <Button type="button" disabled={busy||!dirty||!valid} onClick={()=>void save()}
   className="min-h-9">
   {busy?"Saving…":"Save readiness policy"}
  </Button>
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
