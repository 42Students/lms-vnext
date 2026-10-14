"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Option={text:string;correct:boolean;sequence:number};
type Question={type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;options:Option[]};
type Quiz={id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxAttempts:number;sequence:number;status:string;updatedAt:string;};
const fresh=():Question=>({
 type:"SINGLE_CHOICE",prompt:"",points:1,sequence:0,
 options:[{text:"",correct:true,sequence:0},{text:"",correct:false,sequence:1}],
});
export function FacultyChoiceQuizBuilder({deliveryId,lessons,quizzes}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];quizzes:readonly Quiz[];
}){
 const router=useRouter();
 const [selected,setSelected]=useState("");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxAttempts,setMaxAttempts]=useState(1);
 const [questions,setQuestions]=useState<Question[]>([fresh()]);
 const [confirmed,setConfirmed]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const chosen=quizzes.find(q=>q.id===selected);
 async function choose(id:string){
  setSelected(id);setConfirmed(false);setError(null);
  const q=quizzes.find(x=>x.id===id);
  if(!q){setTitle("");setDescription("");setDueAt("");setMaxAttempts(1);
    setQuestions([fresh()]);setLessonId(lessons[0]?.id??"");return;}
  setTitle(q.title);setDescription(q.description??"");setDueAt(q.dueAt?.slice(0,16)??"");
  setMaxAttempts(q.maxAttempts);setLessonId(q.lessonId);setPending(true);
  try{
   const res=await fetch("/api/courses/quizzes/"+encodeURIComponent(q.id)+
     "?deliveryId="+encodeURIComponent(deliveryId),{cache:"no-store"});
   if(!res.ok)throw new Error("Cannot load quiz questions for this Section.");
   const response=await res.json() as {
    questions:Array<{type:Question["type"];prompt:string;points:number;sequence:number;
      options:Array<{text:string;correct?:boolean;sequence:number}>}>;
   };
   setQuestions(response.questions.map((x,i)=>({
    type:x.type,prompt:x.prompt,points:x.points,sequence:i,
    options:x.options.map((o,j)=>({text:o.text,correct:o.correct??false,sequence:j})),
   })));
  }catch(e){setError(e instanceof Error?e.message:"Quiz details unavailable");setQuestions([]);}
  finally{setPending(false);}
 }
 function updateQuestion(i:number,fn:(q:Question)=>Question){
  setQuestions(old=>old.map((q,n)=>n===i?fn(q):q));setConfirmed(false);
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"){
  if(!confirmed){setError("Confirm the action before saving.");return;}
  setError(null);setPending(true);
  try{
   const body=action==="PUBLISH"?{
     action,quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt,confirmed:true,
   }:{
     action,confirmed:true,
     ...(action==="CREATE"?{lessonId,
       sequence:Math.max(0,...quizzes.filter(x=>x.lessonId===lessonId).map(x=>x.sequence+1))}
       :{quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt}),
     title,description:description||null,dueAt:dueAt?new Date(dueAt).toISOString():null,
     maxAttempts,questions:questions.map((q,i)=>({
      ...q,sequence:i,options:q.options.map((o,j)=>({...o,sequence:j})),
     })),
   };
   const res=await fetch("/api/courses/faculty/quizzes/"+encodeURIComponent(deliveryId)+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   if(!res.ok)throw new Error("Quiz write was rejected. Check your choices or refresh a stale draft.");
   setConfirmed(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}
  finally{setPending(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Choice-question quiz builder</h2>
  <label className="grid gap-1 text-sm">Quiz
   <select value={selected} onChange={e=>void choose(e.target.value)}
    className="min-h-10 rounded border border-border p-2">
    <option value="">Create new draft</option>
    {quizzes.map(q=><option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
   </select></label>
  {chosen?<p className="text-xs text-body">State: {chosen.status}; published quizzes and attempted quizzes cannot change their questions.</p>:null}
  {!chosen?<label className="grid gap-1 text-sm">Lesson
   <select value={lessonId} onChange={e=>setLessonId(e.target.value)}
    className="min-h-10 rounded border border-border p-2">
    {lessons.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
   </select></label>:null}
  <label className="grid gap-1 text-sm">Quiz title
   <input value={title} maxLength={255} onChange={e=>setTitle(e.target.value)}
    className="min-h-10 rounded border border-border p-2"/></label>
  <label className="grid gap-1 text-sm">Instructions
   <textarea value={description} maxLength={10000} rows={2}
    onChange={e=>setDescription(e.target.value)}
    className="rounded border border-border p-2"/></label>
  <label className="grid gap-1 text-sm">Due date (optional)
   <input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}
    className="min-h-10 rounded border border-border p-2"/></label>
  <label className="grid gap-1 text-sm">Maximum attempts
   <input type="number" min={1} max={20} value={maxAttempts}
    onChange={e=>setMaxAttempts(Number(e.target.value))}
    className="min-h-10 rounded border border-border p-2"/></label>
  {questions.map((q,i)=><fieldset key={i}
   className="space-y-3 rounded-lg border border-border p-4">
   <legend className="text-sm font-semibold">Question {i+1}</legend>
   <label className="grid gap-1 text-sm">Prompt
    <textarea value={q.prompt} maxLength={5000} rows={2}
     onChange={e=>updateQuestion(i,old=>({...old,prompt:e.target.value}))}
     className="rounded border border-border p-2"/></label>
   <div className="flex flex-wrap gap-3">
    <label className="grid gap-1 text-sm">Type
     <select value={q.type}
      onChange={e=>updateQuestion(i,old=>({...old,type:e.target.value as Question["type"]}))}
      className="min-h-10 rounded border border-border p-2">
      <option value="SINGLE_CHOICE">Single choice</option>
      <option value="MULTIPLE_CHOICE">Multiple choice</option>
     </select></label>
    <label className="grid gap-1 text-sm">Points
     <input type="number" min={1} max={1000} value={q.points}
      onChange={e=>updateQuestion(i,old=>({...old,points:Number(e.target.value)}))}
      className="min-h-10 w-24 rounded border border-border p-2"/></label>
   </div>
   {q.options.map((o,j)=><div key={j} className="flex flex-wrap items-center gap-2">
    <label className="grow text-sm">Option {j+1}
     <input value={o.text} maxLength={2000}
      onChange={e=>updateQuestion(i,old=>({...old,options:old.options.map((x,k)=>k===j?{...x,text:e.target.value}:x)}))}
      className="mt-1 block min-h-10 w-full rounded border border-border p-2"/></label>
    <label className="flex items-center gap-1 text-xs">
     <input type="checkbox" checked={o.correct}
      onChange={e=>updateQuestion(i,old=>({...old,options:old.options.map((x,k)=>({...x,correct:k===j?e.target.checked:
       (old.type==="SINGLE_CHOICE"&&e.target.checked?false:x.correct)}))}))}/>
     Correct
    </label>
    <button type="button" disabled={q.options.length<=2}
     onClick={()=>updateQuestion(i,old=>({...old,options:old.options.filter((_,k)=>k!==j)}))}
     className="rounded border border-border px-2 py-1 text-xs">Remove</button>
   </div>)}
   <button type="button" disabled={q.options.length>=20}
    onClick={()=>updateQuestion(i,old=>({...old,options:[...old.options,{text:"",correct:false,sequence:old.options.length}]}))}
    className="rounded border border-border px-3 py-2 text-sm">Add option</button>
   <button type="button" disabled={questions.length<=1}
    onClick={()=>setQuestions(old=>old.filter((_,n)=>n!==i))}
    className="ml-2 rounded border border-border px-3 py-2 text-sm">Remove question</button>
  </fieldset>)}
  <button type="button" disabled={questions.length>=100}
   onClick={()=>setQuestions(old=>[...old,{...fresh(),sequence:old.length}])}
   className="rounded border border-border px-4 py-2 text-sm">Add question</button>
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed}
   onChange={e=>setConfirmed(e.target.checked)}/>
   I confirm these choices, point totals and the current draft state.
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <div className="flex flex-wrap gap-3">
   {!chosen?<button type="button" disabled={!confirmed||pending||!lessonId}
    onClick={()=>void submit("CREATE")} className="rounded bg-primary px-4 py-2 text-on-primary">Create draft</button>:
    <>
    <button type="button" disabled={!confirmed||pending||chosen.status!=="DRAFT"}
     onClick={()=>void submit("EDIT")} className="rounded border border-border px-4 py-2">Save draft</button>
    <button type="button" disabled={!confirmed||pending||chosen.status!=="DRAFT"}
     onClick={()=>void submit("PUBLISH")} className="rounded bg-primary px-4 py-2 text-on-primary">Publish</button>
    </>}
  </div>
  <p className="text-xs text-muted-foreground">
   Each question needs unique nonblank options and valid correct answers; total points must not exceed 10000. Edits are blocked after publication or first attempt.
  </p>
 </section>;
}
