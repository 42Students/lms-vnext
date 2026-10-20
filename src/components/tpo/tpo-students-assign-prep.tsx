"use client";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useEffect,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {apiFetch} from "@/lib/api-fetch";
import {tpoPrepDueAtUtc} from "@/modules/placements/tpo-prep-due-date";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
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
  const deadline=dueAt?tpoPrepDueAtUtc(dueAt):null;
  if(!selection||pending||!offeringId||(dueAt&&!deadline)||picked.length<1)return;
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
 return <section className="min-w-0 space-y-3 border-y border-border py-4" aria-label="Assign preparation course">
  <h2 className="font-semibold">Assign prep</h2>
  <p className="text-sm">Choose a college course and an optional due date for up to 100 selected students per batch. Existing assignments are skipped; students receive an in-app notice.</p>
  <p role="status" className="text-xs">{picked.length} students selected. {picked.length>100?"The first 100 will be checked in this batch.":""}</p>
  <div className="flex min-w-0 flex-wrap gap-3">
   <label className="grid min-w-0 flex-1 gap-1 text-sm">Preparation course
    <Select value={offeringId} onChange={e=>setOfferingId(e.target.value)} disabled={pending}
     >
     <option value="">Choose a course</option>
     {courses.map(course=><option key={course.id} value={course.id}>{course.name} · {course.code}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Due date and time (IST, optional)
    <Input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} />
   </label>
  </div>
  {dueAt&&!tpoPrepDueAtUtc(dueAt)?<InlineNotice tone="error" message="Choose a valid IST due date."/>:null}
  <Button variant="secondary" type="button" disabled={pending||!picked.length||!offeringId||Boolean(dueAt&&!tpoPrepDueAtUtc(dueAt))} onClick={()=>setConfirm(true)}
   >Review prep assignments</Button>
  <Dialog open={confirm} onOpenChange={v=>{if(!pending)setConfirm(v);}}
   title="Assign preparation course?"
   description={"Assign this course to the first "+Math.min(100,picked.length)+" selected students, skipping existing assignments? Learners will be notified."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={pending} onClick={()=>void submit()}>{pending?"Saving…":"Confirm assignments"}</Button></>}>
   <p className="text-sm">Due date: {dueAt?dueAt+" IST":"No due date"}. Review the learner roster and course before confirming.</p>
  </Dialog>
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  {results.some(row=>row.status==="skipped")?<p className="text-sm">Some students belong to another cohort or are no longer active. No cross-college assignment was created.</p>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
