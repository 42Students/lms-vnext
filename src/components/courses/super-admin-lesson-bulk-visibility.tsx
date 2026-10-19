"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
type Lesson={id:string;name:string;courseName:string;contentCount:number;publishedContentCount:number;publishedAndVisibleFlagCount:number};
type Report={selectedLessons:number;matchedContents:number;changed:number;unchanged:number;failures:{id:string;reason:string}[]};
export function SuperAdminLessonBulkVisibility({lessons}:{lessons:readonly Lesson[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]),[pending,setPending]=useState(false);
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState<string|null>(null);
 async function mutate(show:boolean){
  if(!selected.length)return;
  if(!confirm((show?"Make content visible":"Hide content")+" in "+selected.length+" lesson(s) for students?"))return;
  setPending(true);setReport(null);setError(null);
  try{
   const data=await apiFetch<Report>("/api/admin/lessons/bulk-status",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonIds:selected,visibleToStudents:show,confirmed:true}),
   });
   setReport(data);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{setPending(false);}
 }
 return <section aria-label="Lesson bulk visibility" className="space-y-3 border-b border-border pb-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold">Bulk lesson visibility</h2>
   <span role="status" className="text-sm text-muted-foreground">{selected.length} of {lessons.length} lessons selected</span>
  </div>
  <p className="text-sm text-body">Show or hide student access to published lesson content; unpublished content stays unpublished. This is a bulk operation with a per-content failure report.</p>
  <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold">
    <Checkbox checked={lessons.length>0&&selected.length===lessons.length}
      onChange={e=>setSelected(e.target.checked?lessons.map(l=>l.id):[])} disabled={pending}/> Select all on this page
  </label>
  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
   {lessons.map(lesson=><label key={lesson.id} className="flex min-h-10 items-center gap-3 border-b border-border px-3 py-2 text-sm">
    <Checkbox checked={selected.includes(lesson.id)} disabled={pending}
     onChange={e=>setSelected(list=>e.target.checked?[...list,lesson.id]:list.filter(id=>id!==lesson.id))}/>
    <span className="min-w-0"><span className="block truncate font-semibold">{lesson.name}</span>
     <span className="text-xs text-muted-foreground">{lesson.courseName} · {lesson.publishedAndVisibleFlagCount}/{lesson.publishedContentCount} published records visible</span>
    </span>
   </label>)}
  </div>
  <div className="flex flex-wrap gap-2">
   <Button type="button" disabled={pending||!selected.length} onClick={()=>void mutate(true)}>{pending?"Saving…":"Show selected"}</Button>
   <Button type="button" variant="secondary" disabled={pending||!selected.length} onClick={()=>void mutate(false)}>Hide selected</Button>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {report?<div role="status" className="space-y-1 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3 text-sm">
   <p>{report.changed} content records updated · {report.unchanged} unchanged · {report.failures.length} failed</p>
   {report.failures.length?<ul className="list-disc pl-5">{report.failures.slice(0,25).map(row=><li key={row.id}>Lesson update was not applied. Review the selection and retry.</li>)}</ul>:null}
  </div>:null}
 </section>;
}
