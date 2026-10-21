"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Alert} from "@/components/ui/alert";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
type Course={id:string;name:string};
type Report={
 selectedCourses:number;matchedLessons:number;matchedContents:number;
 changed:number;unchanged:number;changedCourses:number;
 operation:"COURSE_AND_PUBLISHED_CONTENT_VISIBILITY";
 failures:{id:string;reason:string}[];failedCourseIds:string[];
};
/** Selection is browser-session scoped to one UUID college, never to the
 * complete Super Admin account. The API independently verifies every ID. */
export function SuperAdminCourseBulkVisibility({courses,collegeId,maxSelection=100}:{
 courses:readonly Course[];collegeId:string;maxSelection?:number;
}){
 const router=useRouter(),pendingRef=useRef(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [report,setReport]=useState<Report|null>(null);
 const [action,setAction]=useState<boolean|null>(null);
 const [lastAction,setLastAction]=useState<boolean|null>(null);
 const [missingOnPage,setMissingOnPage]=useState(0);
 const safeLimit=Math.max(1,Math.min(100,maxSelection));
 const storageKey="lms:college-bulk-course-selection:"+collegeId;
 useEffect(()=>{
  try{
   const value=JSON.parse(window.sessionStorage.getItem(storageKey)??"[]") as unknown;
   setSelected(Array.isArray(value)?[...new Set(value.filter(
    (id):id is string=>typeof id==="string"&&/^[0-9a-f-]{36}$/i.test(id)
   ))].slice(0,safeLimit):[]);
  }catch{setSelected([]);}
  setReady(true);
 },[storageKey,safeLimit]);
 function changeSelection(next:string[]){
  const valid=[...new Set(next)].slice(0,safeLimit);
  setSelected(valid);setError(null);
  try{window.sessionStorage.setItem(storageKey,JSON.stringify(valid));}
  catch{setError("Selections may not be kept when changing pages on this device.");}
 }
 const currentIds=new Set(courses.map(row=>row.id));
 const selectedHere=selected.filter(id=>currentIds.has(id));
 const offPage=selected.filter(id=>!currentIds.has(id));
 function selectPage(checked:boolean){
  if(pendingRef.current)return;
  changeSelection(checked?[
   ...selected,...courses.filter(row=>!selected.includes(row.id)).map(row=>row.id),
  ]:selected.filter(id=>!currentIds.has(id)));
 }
 function chooseAction(visible:boolean,ids?:readonly string[]){
  if(pendingRef.current)return;
  if(ids?.length){changeSelection([...ids]);}
  if(!(ids?.length??selected.length))return;
  setAction(visible);setError(null);
 }
 async function apply(){
  if(pendingRef.current||action===null||!selected.length)return;
  pendingRef.current=true;setPending(true);setError(null);setReport(null);
  const ids=[...selected];
  const visibility=action;setLastAction(visibility);
  try{
   const data=await apiFetch<Report>("/api/admin/courses/bulk-status",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({courseIds:ids,visibleToStudents:visibility,confirmed:true}),
   });
   if(data.operation!=="COURSE_AND_PUBLISHED_CONTENT_VISIBILITY"||
    data.selectedCourses>ids.length||!Array.isArray(data.failedCourseIds))
    throw Error("Bulk response could not be verified. Refresh before retrying.");
   setReport(data);
   changeSelection(data.failedCourseIds);
   router.refresh();
  }catch(reason){
   const message=reason instanceof FriendlyFetchError&&reason.code==="COURSE_NOT_FOUND"?
    "Some selected courses are not available in this college. Clear selections and select eligible courses again.":
    reason instanceof FriendlyFetchError&&reason.code==="COURSE_VISIBILITY_BULK_TOO_LARGE"?
    "Selection exceeds the allowed bulk limit. Select fewer courses.":
    reason instanceof Error?reason.message:"Course visibility could not be updated.";
   setError(message);
  }finally{setAction(null);setPending(false);pendingRef.current=false;}
 }
 // Count previously loaded IDs separately; there is no implication that
 // an unmounted page is still an authorized college.
 useEffect(()=>{setMissingOnPage(offPage.length);},[offPage.length]);
 return <section aria-label="Bulk published content visibility"
   className="min-w-0 space-y-3 border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h3 className="font-semibold text-heading">Published lesson content visibility</h3>
    <p className="mt-1 text-xs text-muted-foreground">
     Select courses on the catalogue pages, then Show or Hide them for students.
     Hiding keeps course records active for staff, but removes access for learners.
    </p>
   </div>
   <span role="status" className="text-xs font-semibold tabular-nums text-body">
    {selected.length} selected across current college and loaded pages
   </span>
  </div>
  <div className="flex flex-wrap items-center gap-2">
   <Button type="button" variant="primary" disabled={!ready||pending||!selected.length}
    onClick={()=>chooseAction(true)} className="min-h-11 md:min-h-9">Show to students</Button>
   <Button type="button" variant="danger" disabled={!ready||pending||!selected.length}
    onClick={()=>chooseAction(false)} className="min-h-11 md:min-h-9">Hide from students</Button>
   <Button type="button" variant="secondary" disabled={!ready||pending||!selected.length}
    onClick={()=>changeSelection([])} className="min-h-11 md:min-h-9">Clear selection</Button>
  </div>
  <label className="inline-flex min-h-11 items-center gap-2 text-sm">
   <Checkbox checked={Boolean(courses.length&&courses.every(row=>selected.includes(row.id)))}
    disabled={!ready||pending||!courses.length} onChange={event=>selectPage(event.target.checked)}/>
   Select all courses on this page ({courses.length})
  </label>
  <div className="min-w-0 overflow-x-auto rounded border border-border">
   <table className="w-full min-w-[460px] border-collapse text-left text-sm">
    <thead><tr className="border-b border-border">
     <th className="p-2"><span className="sr-only">Selected</span></th>
     <th className="p-2">Course</th><th className="p-2">Status</th>
    </tr></thead>
    <tbody>{courses.map(course=><tr key={course.id} className="border-b border-border last:border-b-0">
     <td className="p-2"><Checkbox aria-label={"Select "+course.name}
      disabled={!ready||pending||(!selected.includes(course.id)&&selected.length>=safeLimit)}
      checked={selected.includes(course.id)}
      onChange={event=>changeSelection(event.target.checked?
       [...selected,course.id]:selected.filter(id=>id!==course.id))}/></td>
     <td className="p-2">{course.name}</td>
     <td className="p-2 text-xs text-muted-foreground">{selected.includes(course.id)?"Selected":"—"}</td>
    </tr>)}</tbody>
   </table>
  </div>
  {missingOnPage>0?<Alert tone="info">
   {missingOnPage} previously selected course(s) are on other loaded pages.
   They will be checked against the current college again before any update.
  </Alert>:null}
  {selected.length>=safeLimit?<p role="status" className="text-xs text-warning-text">
   Bulk selection limit reached ({safeLimit}). Clear some courses to select others.
  </p>:null}
  <ConfirmDialog open={action!==null}
   onOpenChange={next=>{if(!next&&!pending)setAction(null);}}
   title={action?"Show courses to students?":"Hide courses from students?"}
   description={(action?"Show":"Hide")+" "+selected.length+
    " selected course(s) in the learner catalogue and their published lessons. No course records are archived or deleted."}
   confirmLabel={action?"Show to students":"Hide from students"}
   confirmVariant={action?"primary":"danger"} pending={pending}
   onConfirm={()=>void apply()}>
   <ul className="max-h-48 space-y-1 overflow-y-auto text-sm" aria-label="Selected courses">
    {selectedHere.slice(0,5).map(id=><li key={id}>{courses.find(row=>row.id===id)?.name??"Course"}</li>)}
    {selectedHere.length>5?<li>Plus {selectedHere.length-5} more on this page</li>:null}
    {offPage.length?<li>Plus {offPage.length} previously loaded course(s) on other pages</li>:null}
   </ul>
  </ConfirmDialog>
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  {report?<Alert tone={report.failures.length?"warning":"success"} role="status">
   <p>Updated {report.selectedCourses-report.failedCourseIds.length} of {report.selectedCourses} course(s)</p>
   <p className="text-xs">{report.changed} published item(s) changed;
    {report.unchanged} unchanged; {report.failures.length} failure(s).
    {report.changedCourses} course visibility flag(s) changed; no records were archived.</p>
   {report.failures.length?<ul className="mt-2 list-disc pl-4 text-xs">
    {report.failures.slice(0,20).map((failure,index)=>
     <li key={failure.id+":"+index}>{failure.reason}</li>)}
   </ul>:null}
   {report.failedCourseIds.length?<Button type="button" variant="secondary"
     disabled={pending||lastAction===null}
     onClick={()=>lastAction===null?undefined:chooseAction(lastAction,report.failedCourseIds)}>
     Retry failed courses
    </Button>:null}
  </Alert>:null}
 </section>;
}
