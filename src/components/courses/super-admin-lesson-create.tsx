"use client";
import { Alert } from "@/components/ui/alert";

import {useRef,useState} from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";

type Path={id:string;courseName:string;cohortName:string;periodName:string};
 export function SuperAdminLessonCreate({paths}:{paths:readonly Path[]}){
 const router=useRouter();
 const [pathId,setPathId]=useState(paths[0]?.id??"");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [visibleToStudents,setVisibleToStudents]=useState(true);
 const [pending,setPending]=useState(false);
 const lock=useRef(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const [fieldErrors,setFieldErrors]=useState<{path?:string;name?:string}>({});
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||lock.current)return;
  const errors:{path?:string;name?:string}={};
  if(!paths.some(item=>item.id===pathId))errors.path="Select a course";
  if(!name.trim())errors.name="Enter a lesson name";
  else if(name.trim().length>255)errors.name="Maximum 255 characters";
  setFieldErrors(errors);
  if(Object.keys(errors).length)return;
  lock.current=true;setPending(true);setError(null);setNotice("");
  const selected=paths.find(item=>item.id===pathId);
  try{
   // Legacy sequence=0 means atomically append under the path lock; do
   // not race a client GET(max sequence) against another author's create.
   await apiFetch("/api/courses/lessons",{method:"POST",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learningPathId:pathId,name:name.trim(),
     description:description.trim()||null,sequence:0,
     active:true,enabled:visibleToStudents,visibleToStudents}),
   });
   setNotice("Created lesson “"+name.trim()+"” in "+(selected?.courseName??"the selected Course")+".");
   setName("");setDescription("");setVisibleToStudents(true);router.refresh();
  }catch(e){
   const message=e instanceof Error?e.message:"Check your entries and try again.";
   setError("Lesson was not created. "+(
    /LESSON_NAME_CONFLICT|duplicate/i.test(message)
     ?"A lesson with this name already exists in the course":message));
  }finally{lock.current=false;setPending(false);}
 }
 if(!paths.length)return <p role="status" className="border-y border-border py-4 text-sm text-body leading-[22px]">Open a course offering to create its first lesson.</p>;
 return <details className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-[var(--lms-space-4)] text-sm font-[650] text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Add Lesson</summary>
  <form aria-label="Add lesson" onSubmit={event=>void submit(event)} className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)]">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course / Offering
   <Select required value={pathId} disabled={pending} onChange={event=>{setPathId(event.target.value);setFieldErrors(old=>({...old,path:undefined}));}}
    className="min-h-11 w-full md:min-h-9">
    {paths.map(path=><option key={path.id} value={path.id}>
     {path.courseName} · {path.cohortName} · {path.periodName}
    </option>)}
   </Select>
   {fieldErrors.path?<span className="text-xs text-error" role="alert">{fieldErrors.path}</span>:null}
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson name
   <Input maxLength={255} value={name} disabled={pending}
    onChange={event=>{setName(event.target.value);setFieldErrors(old=>({...old,name:undefined}));}}
    aria-invalid={Boolean(fieldErrors.name)}
    className="min-h-11 w-full md:min-h-9"/>
   {fieldErrors.name?<span className="text-xs text-error" role="alert">{fieldErrors.name}</span>:null}
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description (optional)
   <Textarea maxLength={5000} rows={2} value={description}
    onChange={event=>setDescription(event.target.value)}
    className="min-h-11 w-full md:min-h-9"/>
  </label>
  <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
   <Checkbox disabled={pending} checked={visibleToStudents}
    onChange={event=>setVisibleToStudents(event.target.checked)}/>
   Visible to students
  </label>
  <p className="text-xs text-muted-foreground">Off hides this lesson and its content from students; staff still see it.</p>
  {error?<Alert tone="error" title="Lesson was not created">{error}
   <Button type="button" size="sm" variant="ghost" onClick={()=>setError(null)}>Dismiss</Button>
  </Alert>:null}
  {notice?<Alert tone="success" role="status">{notice}</Alert>:null}
  <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending}>
   {pending?"Saving…":"Add Lesson"}</Button>
  </form>
 </details>;
}
