"use client";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";

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
 const [pathId,setPathId]=useState("");
 const [courseSearch,setCourseSearch]=useState("");
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
 if(!paths.length)return <section aria-label="Create New Lesson" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-canvas-padding)]">
  <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">Create New Lesson</h2>
  <Alert tone="warning" title="No courses in this college yet">
    Create a Course and an active Offering before adding its first Lesson.
    <Link href="/admin/courses" className="ml-2 font-semibold text-link underline">Go to Courses</Link>
  </Alert>
 </section>;
 return <section aria-label="Create New Lesson" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-canvas-padding)]">
  <h2 className="mb-[var(--lms-space-4)] text-[18px] font-semibold text-[var(--lms-heading)]">Create New Lesson</h2>
  <form aria-label="Create New Lesson" noValidate onSubmit={event=>void submit(event)} className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)]">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
   <Input type="search" value={courseSearch} onChange={event=>setCourseSearch(event.target.value)}
     placeholder="Search courses" aria-label="Search courses" disabled={pending}
     className="min-h-11 w-full md:min-h-9"/>
   <Select required value={pathId} disabled={pending} onChange={event=>{setPathId(event.target.value);setFieldErrors(old=>({...old,path:undefined}));}}
    className="min-h-11 w-full md:min-h-9">
    <option value="">Select course</option>
    {paths.filter(path=>path.id===pathId||(path.courseName+" "+path.cohortName+" "+path.periodName)
      .toLocaleLowerCase("en-IN").includes(courseSearch.trim().toLocaleLowerCase("en-IN")))
      .map(path=><option key={path.id} value={path.id}>
       {path.courseName?.trim()||"Course "+path.id} · {path.cohortName} · {path.periodName}
      </option>)}
   </Select>
   {fieldErrors.path?<span className="text-xs text-error" role="alert">{fieldErrors.path}</span>:null}
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson Name
   <Input maxLength={255} placeholder="e.g., Introduction to Arrays" value={name} disabled={pending}
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
  <p className="text-xs text-muted-foreground">A new lesson is appended to its course. You can reorder lessons after saving.</p>
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
  <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||!pathId||!name.trim()}>
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="mr-2 inline-block">
     <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>{pending?"Saving…":"Create Lesson & Add Another"}
  </Button>
  </form>
 </section>;
}
