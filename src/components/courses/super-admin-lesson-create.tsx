"use client";
import { Alert } from "@/components/ui/alert";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";

type Path={id:string;courseName:string;cohortName:string;periodName:string};
type Lesson={sequence:number};
export function SuperAdminLessonCreate({paths}:{paths:readonly Path[]}){
 const router=useRouter();
 const [pathId,setPathId]=useState(paths[0]?.id??"");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!pathId||!name.trim()||pending)return;
  setPending(true);setError(null);
  try{
   const result=await apiFetch<{lessons:Lesson[]}>("/api/courses/lessons?"+
     new URLSearchParams({learningPathId:pathId}),{method:"GET",timeoutMs:12000});
   const sequence=result.lessons.reduce((max,lesson)=>Math.max(max,lesson.sequence+1),0);
   if(sequence>10000)throw new Error("This learning path has reached the lesson ordering limit.");
   await apiFetch("/api/courses/lessons",{method:"POST",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learningPathId:pathId,name:name.trim(),
     description:description.trim()||null,sequence}),
   });
   setName("");setDescription("");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Lesson could not be saved.");}
  finally{setPending(false);}
 }
 if(!paths.length)return <p role="status" className="border-y border-border py-4 text-sm text-body">Open a course offering to create its first lesson.</p>;
 return <details className="min-w-0 border-b border-border pb-[var(--lms-space-4)]">
  <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-[var(--lms-space-4)] text-sm font-[650] text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Add Lesson</summary>
  <form aria-label="Add lesson" onSubmit={event=>void submit(event)} className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)]">
  <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course / Offering
   <Select required value={pathId} onChange={event=>setPathId(event.target.value)}
    className="min-h-11 w-full md:min-h-9">
    {paths.map(path=><option key={path.id} value={path.id}>
     {path.courseName} · {path.cohortName} · {path.periodName}
    </option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson name
   <Input required maxLength={255} value={name} onChange={event=>setName(event.target.value)}
    className="min-h-11 w-full md:min-h-9"/>
  </label>
  <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description (optional)
   <Textarea maxLength={5000} rows={2} value={description}
    onChange={event=>setDescription(event.target.value)}
    className="min-h-11 w-full md:min-h-9"/>
  </label>
  {error?<Alert tone="error">{error}</Alert>:null}
  <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||!name.trim()||!pathId}>
   {pending?"Saving…":"Add Lesson"}</Button>
  </form>
 </details>;
}
