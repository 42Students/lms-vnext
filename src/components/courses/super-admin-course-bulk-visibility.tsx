"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {useState} from "react";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
type Course={id:string;name:string};
type Report={selectedCourses:number;matchedLessons:number;matchedContents:number;
 changed:number;unchanged:number;failures:{id:string;reason:string}[];failedCourseIds:string[]};

export function SuperAdminCourseBulkVisibility({courses}:{courses:readonly Course[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [report,setReport]=useState<Report|null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [lastAction,setLastAction]=useState<boolean|null>(null);
 const currentIds=new Set(courses.map(course=>course.id));
 const selectedInScope=selected.filter(id=>currentIds.has(id));
 async function apply(visibleToStudents:boolean,ids=selectedInScope){
  // Never send IDs from a previous acting-college or an earlier page.
  ids=ids.filter(id=>currentIds.has(id));
  if(!ids.length||pending)return;
  if(!window.confirm((visibleToStudents?"Show":"Hide")+" published lesson content in "+
    ids.length+" selected course(s) to students?"))return;
  setPending(true);setError(null);setReport(null);setLastAction(visibleToStudents);
  try{
   const data=await apiFetch<Report>("/api/admin/courses/bulk-status",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({courseIds:ids,visibleToStudents,confirmed:true}),
   });
   setReport(data);
   router.refresh();
  }catch(e){
   setError(e instanceof FriendlyFetchError&&e.code==="COURSE_VISIBILITY_BULK_TOO_LARGE"
    ?"Too many published lesson items are selected. Select fewer courses and try again."
    :e instanceof FriendlyFetchError&&e.code==="COURSE_NOT_FOUND"
     ?"One or more selected courses changed. Refresh and select current courses."
     :e instanceof Error?e.message:"Unable to update student visibility.");
  }
  finally{setPending(false);}
 }
 return <section aria-label="Bulk course visibility" className="space-y-3 border-b border-border pb-5">
  <h3 className="font-semibold text-foreground">Students see it</h3>
  <p className="text-sm text-body">Show to students or hide from students across currently published lesson content in selected courses. Archived or unpublished content remains unchanged. New content keeps its own student visibility setting.</p>
  <label className="flex min-h-11 items-center gap-2 py-2 text-sm">
   <Checkbox checked={courses.length>0&&selectedInScope.length===courses.length}
    disabled={pending||!courses.length}
    onChange={e=>setSelected(e.target.checked?courses.map(course=>course.id):[])}/>
   Select all courses on this page
  </label>
  <ScrollCue axis="y" label="Bulk course selection" viewportClassName="max-h-48"><div className="divide-y divide-border border-y border-border">
   {courses.map(course=><label key={course.id} className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={selectedInScope.includes(course.id)} disabled={pending}
     onChange={e=>setSelected(ids=>{
      const scoped=ids.filter(id=>currentIds.has(id));
      return e.target.checked?[...new Set([...scoped,course.id])]:scoped.filter(id=>id!==course.id);
     })}/>
    <span>{course.name}</span>
   </label>)}
  </div></ScrollCue>
  <p className="text-xs text-muted-foreground" role="status">{selectedInScope.length} selected</p>
  <div className="flex flex-wrap gap-2">
   <Button type="button" variant="secondary" disabled={!selectedInScope.length||pending}
    onClick={()=>void apply(true)}
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9">
    {pending?"Updating…":"Show to students"}</Button>
   <Button type="button" variant="secondary" disabled={!selectedInScope.length||pending}
    onClick={()=>void apply(false)}
    className="min-h-11">
    Hide from students</Button>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {report?<div role="status" className="space-y-2 text-sm">
   <p>{report.changed} updated · {report.unchanged} unchanged · {report.failures.length} failed</p>
   {report.failures.length?<Button type="button" variant="secondary" disabled={pending||lastAction===null||!report.failedCourseIds.some(id=>currentIds.has(id))}
    onClick={()=>lastAction!==null?void apply(lastAction,report.failedCourseIds):undefined}
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
    Retry failed
   </Button>:null}
   {report.matchedLessons===0?<p>No published lesson content is available for the selected courses.</p>:null}
  </div>:null}
 </section>;
}
