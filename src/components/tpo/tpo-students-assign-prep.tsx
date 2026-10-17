"use client";
import {useEffect,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {apiFetch} from "@/lib/api-fetch";
import {tpoPrepDueAtUtc} from "@/modules/placements/tpo-prep-due-date";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTpoStudentsSelection} from "./tpo-students-selection";
type Course={id:string;cohortId:string;name:string;code:string};
type Result={id:string;status:"assigned"|"duplicate"|"skipped"};
export function TpoStudentsAssignPrep(){
 const selection=useTpoStudentsSelection();
 const [courses,setCourses]=useState<Course[]>([]);
 const [offeringId,setOfferingId]=useState(""),[dueAt,setDueAt]=useState("");
 const [confirm,setConfirm]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [results,setResults]=useState<Result[]>([]);
 const {run,pending}=useGuardedAction({timeoutMs:120000});
 useEffect(()=>{void Promise.resolve().then(async()=>{
  try{const r=await apiFetch<{courses:Course[]}>("/api/placements/tpo/students/prep",{cache:"no-store"});
   setCourses(r.courses);
  }catch{setError("Preparation courses could not be loaded. Retry the roster to check access.");}
 });},[]);
 const picked=selection?.selected??[];
 async function submit(){
  const deadline=tpoPrepDueAtUtc(dueAt);
  if(!selection||pending||!offeringId||!deadline||picked.length<1)return;
  setError("");setNotice("");
  try{
   await run(async()=>{
    const rows=await apiFetch<{results:Result[];counts:{assigned:number;duplicate:number;skipped:number}}>(
     "/api/placements/tpo/students/prep",{
      method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify({offeringId,dueAt:deadline,membershipIds:picked.slice(0,100)}),
     });
    setResults(rows.results);setConfirm(false);
    selection.setSelected(ids=>ids.filter(id=>!rows.results.some(row=>row.id===id&&row.status!=="skipped")));
    setNotice(rows.counts.assigned+" assigned · "+rows.counts.duplicate+" already assigned · "+rows.counts.skipped+" not eligible for this cohort.");
   });
  }catch{setError("Could not assign preparation. Your selection and due date are kept for retry.");}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Assign preparation course">
  <h2 className="font-semibold">Assign prep</h2>
  <p className="text-sm">Choose a college course and a due date for up to 100 selected students per batch. Existing assignments are skipped; students receive an in-app notice.</p>
  <p role="status" className="text-xs">{picked.length} students selected. {picked.length>100?"The first 100 will be checked in this batch.":""}</p>
  <div className="flex flex-wrap gap-3">
   <label className="grid gap-1 text-sm">Preparation course
    <select value={offeringId} onChange={e=>setOfferingId(e.target.value)} disabled={pending}
     className="min-h-11 rounded border border-border bg-surface p-2">
     <option value="">Choose a course</option>
     {courses.map(course=><option key={course.id} value={course.id}>{course.name} · {course.code}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm">Due date and time (IST)
    <input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} className="min-h-11 rounded border border-border p-2"/>
   </label>
  </div>
  {dueAt&&!tpoPrepDueAtUtc(dueAt)?<p role="alert" className="text-error">Choose a valid IST due date.</p>:null}
  <button type="button" disabled={pending||!picked.length||!offeringId||!tpoPrepDueAtUtc(dueAt)} onClick={()=>setConfirm(true)}
   className="min-h-11 rounded border border-border px-4 font-semibold text-primary-text disabled:opacity-50">Review prep assignments</button>
  <Dialog open={confirm} onOpenChange={v=>{if(!pending)setConfirm(v);}}
   title="Assign preparation course?"
   description={"Assign this course to the first "+Math.min(100,picked.length)+" selected students, skipping existing assignments? Learners will be notified."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={pending} onClick={()=>void submit()}>{pending?"Saving…":"Confirm assignments"}</Button></>}>
   <p className="text-sm">Due date: {dueAt} IST. Review the learner roster and course before confirming.</p>
  </Dialog>
  {notice?<p role="status" aria-live="polite" className="text-sm">{notice}</p>:null}
  {results.some(row=>row.status==="skipped")?<p className="text-sm">Some students belong to another cohort or are no longer active. No cross-college assignment was created.</p>:null}
  {error?<p role="alert" className="text-error">{error}</p>:null}
 </section>;
}
