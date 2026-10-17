"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
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
 if(!paths.length)return <p className="text-sm text-body">Open a course offering to create its first lesson.</p>;
 return <form aria-label="Add lesson" onSubmit={event=>void submit(event)} className="grid gap-3 rounded border border-border p-4">
  <h2 className="font-semibold text-foreground">Add Lesson</h2>
  <label className="grid gap-1 text-sm font-semibold">Course / Offering
   <select required value={pathId} onChange={event=>setPathId(event.target.value)}
    className="min-h-11 rounded border border-border bg-surface px-3">
    {paths.map(path=><option key={path.id} value={path.id}>
     {path.courseName} · {path.cohortName} · {path.periodName}
    </option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm font-semibold">Lesson name
   <input required maxLength={255} value={name} onChange={event=>setName(event.target.value)}
    className="min-h-11 rounded border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold">Description (optional)
   <textarea maxLength={5000} rows={2} value={description}
    onChange={event=>setDescription(event.target.value)}
    className="rounded border border-border bg-surface p-3"/>
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <button type="submit" disabled={pending||!name.trim()||!pathId}
   className="min-h-11 rounded border border-border px-4 font-semibold disabled:opacity-50">
   {pending?"Saving…":"Add Lesson"}</button>
 </form>;
}
