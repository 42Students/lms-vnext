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
};
type Failure = {id:string;lessonId:string;reason:string};
type Report = {selectedLessons:number;matchedContents:number;changed:number;unchanged:number;failures:Failure[]};
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
 return <details aria-label="Lesson bulk published content visibility"
  className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
   Bulk published content visibility
  </summary>
  <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
   <p role="status" className="text-sm text-muted-foreground">
    {selectedInScope.length} of {lessons.length} lessons selected
   </p>
   <p className="text-sm text-body leading-[22px]">
    Show or hide currently published lesson content for students. This operation
    does not change a lesson&apos;s own active status, or unpublished and future content.
    It does not delete any files.
   </p>
   {listIncomplete?<Alert tone="warning">The lesson list is incomplete. Refresh it before changing visibility.</Alert>:null}
   <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold md:min-h-10">
    <Checkbox checked={lessons.length>0&&selectedInScope.length===lessons.length}
     onChange={event=>setSelected(event.target.checked?lessons.map(item=>item.id):[])}
     disabled={!canChange}/>
    Select all on this page
   </label>
   <ScrollCue axis="y" label="Lesson bulk selection" viewportClassName="max-h-48">
    <div className="grid gap-2 md:grid-cols-2">
     {lessons.map(lesson=><label key={lesson.id}
      className="flex min-h-11 min-w-0 items-center gap-3 border-b border-border px-3 py-2 text-sm md:min-h-10">
      <Checkbox checked={selectedInScope.includes(lesson.id)} disabled={!canChange}
       onChange={event=>setSelected(list=>event.target.checked
        ? [...new Set([...list,lesson.id])]
        : list.filter(id=>id!==lesson.id))}/>
      <span className="min-w-0">
       <span className="block truncate font-semibold">{lesson.name}</span>
       <span className="text-xs text-muted-foreground">
        {lesson.courseName} · {lesson.publishedAndVisibleFlagCount}/{lesson.publishedContentCount} published records visible
       </span>
      </span>
     </label>)}
    </div>
   </ScrollCue>
   <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row">
    <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
     disabled={!canChange||!selectedInScope.length} onClick={()=>plan(true)}>
     {pending?"Saving…":"Show published content"}
    </Button>
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
     disabled={!canChange||!selectedInScope.length} onClick={()=>plan(false)}>
     Hide published content
    </Button>
   </div>
   {error?<Alert tone="error">{error}</Alert>:null}
   {report?<Alert tone={report.failures.length?"warning":"success"} role="status">
    <p>
     {report.selectedLessons-failedLessonIds.length} of {report.selectedLessons} lesson(s) processed without reported errors.
     {" "}{report.changed} published content item(s) changed · {report.unchanged} unchanged · {report.failures.length} failed.
    </p>
    {report.failures.length?<p className="text-sm">
     {report.selectedLessons-failedLessonIds.length} of {report.selectedLessons} processed.
     Retry will target only the failed lessons.
    </p>:null}
    <p className="text-xs">
     Content scope: {report.matchedContents} published records; lesson status and files were not changed.
    </p>
    {report.failures.length?<ul className="list-disc pl-5">
     {report.failures.slice(0,5).map(row=><li key={row.id}>
      {lessons.find(lesson=>lesson.id===row.lessonId)?.name??"Selected lesson"}: {row.reason}
     </li>)}
    </ul>:null}
    {failedLessonIds.length>0&&lastAction!==null?
     <Button type="button" variant="secondary" disabled={!canChange}
      onClick={()=>plan(lastAction,failedLessonIds)} className="min-h-11 md:min-h-9">
      Retry failed
     </Button>:null}
   </Alert>:null}
  </div>
  <ConfirmDialog open={planned!==null} onOpenChange={open=>{if(!open&&!pending)setPlanned(null);}}
   title={planned?.show?"Show published lesson content?":"Hide published lesson content?"}
   description={"Update currently published content in "+(planned?.ids.length??0)+
    " selected lesson(s). No files will be deleted. Lesson active status and draft content stay unchanged."}
   confirmLabel={planned?.show?"Show content":"Hide content"}
   confirmVariant={planned?.show?"primary":"danger"} pending={pending}
   confirmDisabled={!planned||listIncomplete}
   onConfirm={()=>{if(planned)void mutate(planned);}}/>
 </details>;
}
