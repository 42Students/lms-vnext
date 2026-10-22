"use client";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

type Lesson = {
 id:string;name:string;courseName:string;contentCount:number;
 publishedContentCount:number;publishedAndVisibleFlagCount:number;
 visibleToStudents:boolean;
};
type Failure = {id:string;lessonId:string;reason:string};
type Report = {requested:number;updatedCount:number;selectedLessons:number;
 changed:number;unchanged:number;failures:Failure[];
 operation:"LESSON_STATUS_UPDATE";
};
type PlannedAction = {show:boolean;ids:string[]};

export function SuperAdminLessonBulkVisibility({
 lessons, listIncomplete = false,
}:{lessons:readonly Lesson[];listIncomplete?:boolean}){
 const router=useRouter();
 const inFlight=useRef(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [pending,setPending]=useState(false);
 const [planned,setPlanned]=useState<PlannedAction|null>(null);
 const [lastAction,setLastAction]=useState<boolean|null>(null);
 const [report,setReport]=useState<Report|null>(null);
 const [error,setError]=useState<string|null>(null);
 const currentIds=new Set(lessons.map(item=>item.id));
 const selectedInScope=selected.filter(id=>currentIds.has(id));
 const failedLessonIds=report?[...new Set(report.failures.map(item=>item.lessonId))]
   .filter(id=>currentIds.has(id)):[];
 const canChange=!pending&&!inFlight.current&&!listIncomplete;
 function plan(show:boolean,rawIds=selectedInScope){
  if(!canChange)return;
  const ids=[...new Set(rawIds)].filter(id=>currentIds.has(id));
  if(ids.length===0)return;
  if(ids.length>25){setError("Select at most 25 lessons for one bulk operation.");return;}
  setPlanned({show,ids});
 }
 async function mutate(action:PlannedAction){
  if(pending||inFlight.current||listIncomplete)return;
  const ids=action.ids.filter(id=>currentIds.has(id));
  if(!ids.length)return;
  inFlight.current=true;
  setPending(true);setPlanned(null);setReport(null);setError(null);
  setLastAction(action.show);
  try{
   const data=await apiFetch<Report>("/api/admin/lessons/bulk-status",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonIds:ids,visibleToStudents:action.show,confirmed:true}),
   });
   // A successful HTTP response must describe lesson-row changes, not the
   // separate course-level published-content bulk API.
   if(data.operation!=="LESSON_STATUS_UPDATE" ||
      !Array.isArray(data.failures) ||
      !Number.isSafeInteger(data.updatedCount) ||
      data.updatedCount<0 || data.updatedCount>ids.length)
    throw new Error("Unable to verify the lesson bulk result. Refresh and retry.");
   const failed=new Set(data.failures.map(item=>item.lessonId));
   setSelected(ids.filter(id=>failed.has(id)));
   setReport(data);
   router.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:friendlyApiError({}));
   setSelected(ids);
  }finally{
   inFlight.current=false;setPending(false);
  }
 }
 return <section aria-label="Lesson bulk visibility"
  className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <h3 className="mb-2 text-sm font-semibold text-body">Bulk lesson visibility</h3>
  <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
   <p role="status" className="text-sm text-muted-foreground">
    {selectedInScope.length} selected · {lessons.length} lessons on this page
   </p>
   <p className="text-sm text-body leading-[22px]">
    Show or hide lessons for students. This updates each lesson&apos;s own
    Visible to students setting; it does not publish, archive or delete
    individual content items or files.
   </p>
   <p className="text-xs text-muted-foreground">Selection applies to this filtered page only, not lessons on other pages. Change search or course to start a new selection. Lesson active status and content publication are unchanged.</p>
   {listIncomplete?<Alert tone="warning">The lesson list is incomplete. Refresh it before changing visibility.</Alert>:null}
   <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold md:min-h-11">
    <Checkbox checked={lessons.length>0&&selectedInScope.length===lessons.length}
     onChange={event=>setSelected(event.target.checked?lessons.map(item=>item.id):[])}
     disabled={!canChange}/>
    Select all on this page (up to 25 per action)
   </label>
   <ScrollCue axis="y" label="Lesson bulk selection" viewportClassName="max-h-48">
    <div className="grid gap-2 md:grid-cols-2">
     {lessons.map(lesson=><label key={lesson.id}
      className="flex min-h-11 min-w-0 items-center gap-3 border-b border-border px-3 py-2 text-sm md:min-h-11">
      <Checkbox checked={selectedInScope.includes(lesson.id)} disabled={!canChange}
       onChange={event=>setSelected(list=>event.target.checked
        ? [...new Set([...list,lesson.id])]
        : list.filter(id=>id!==lesson.id))}/>
      <span className="min-w-0">
       <span className="block truncate font-semibold">{lesson.name}</span>
       <span className="text-xs text-muted-foreground">
        {lesson.courseName} · {lesson.visibleToStudents?"Visible to students":"Hidden from students"} · {lesson.publishedContentCount} published items
       </span>
      </span>
     </label>)}
    </div>
   </ScrollCue>
   {selectedInScope.length>0?<div role="group" aria-label="Actions on selected lessons" className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
    <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
     disabled={!canChange} onClick={()=>plan(true)}>
     {pending?"Saving…":"Show to students"}
    </Button>
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
     disabled={!canChange} onClick={()=>plan(false)}>
     Hide from students
    </Button>
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
     disabled={!canChange} onClick={()=>{setSelected([]);setError(null);setReport(null);}}>
     Clear selection
    </Button>
   </div>:null}
   {error?<Alert tone="error">{error}</Alert>:null}
   {report?<Alert tone={report.failures.length?"warning":"success"} role="status">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
     <strong>{report.failures.length
      ? (lastAction?"Show to students":"Hide from students")+" was only partially completed"
      : "Lesson visibility updated"}</strong>
     <Button type="button" variant="secondary" onClick={()=>setReport(null)}
      aria-label="Dismiss bulk update results" className="min-h-9">Dismiss</Button>
    </div>
    <p>
     {report.updatedCount} of {report.selectedLessons} lesson(s) processed.
     {" "}{report.changed} lesson visibility setting(s) changed · {report.unchanged} already matched · {report.failures.length} failed.
    </p>
    {report.failures.length?<p className="text-sm">
     ${report.updatedCount} of ${report.selectedLessons} updated. Retry will target only the failed lessons.
    </p>:null}
    <p className="text-xs">
     Lesson active status, published content records and private files were not changed.
    </p>
    {report.failures.length?<ul className="list-disc pl-5">
     {report.failures.slice(0,5).map(row=><li key={row.id}>
      {lessons.find(lesson=>lesson.id===row.lessonId)?.name??("Lesson "+row.lessonId)}: {row.reason.slice(0,200)}
     </li>)}
     {report.failures.length>5?<li>{report.failures.length-5} more failed records. Retry failed to review them.</li>:null}
    </ul>:null}
    {failedLessonIds.length>0&&lastAction!==null?
     <Button type="button" variant="secondary" disabled={!canChange}
      onClick={()=>plan(lastAction,failedLessonIds)} className="min-h-11 md:min-h-9">
      Retry failed
     </Button>:null}
   </Alert>:null}
  </div>
  <ConfirmDialog open={planned!==null} onOpenChange={open=>{if(!open&&!pending)setPlanned(null);}}
   title={planned?.show?"Show lessons to students?":"Hide lessons from students?"}
   description="Selected lessons will have their visibility setting updated. No lesson or content files are deleted."
   confirmLabel={planned?.show?"Show to students":"Hide from students"}
   confirmVariant={planned?.show?"primary":"danger"} pending={pending}
   confirmDisabled={!planned||listIncomplete}
   onConfirm={()=>{if(planned)void mutate(planned);}}>
   <div className="space-y-2 text-sm">
    <p>{planned?.ids.length??0} selected lesson(s); this changes lesson visibility only. Active status and content publication stay unchanged.</p>
    {planned?.ids.length?<ul className="list-disc pl-5">
     {planned.ids.slice(0,5).map(id=><li key={id}>{lessons.find(item=>item.id===id)?.name??("Lesson "+id)}</li>)}
     {planned.ids.length>5?<li>and {planned.ids.length-5} more</li>:null}
    </ul>:null}
   </div>
  </ConfirmDialog>
 </section>;
}
