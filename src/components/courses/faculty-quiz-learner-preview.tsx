"use client";
import { ChoiceInput } from "@/components/ui/choice-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";

type Question={id:string;type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;
 options:{id:string;text:string;correct?:boolean}[]};
type Preview={quiz:{title:string};questions:Question[]};
export function FacultyQuizLearnerPreview({quizId,deliveryId}:{
 quizId:string;deliveryId:string;
}){
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [answers,setAnswers]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const previewKey=(open?"1|":"0|")+quizId+"|"+deliveryId;
 const [prevPreviewKey,setPrevPreviewKey]=useState(previewKey);
 if(prevPreviewKey!==previewKey){setPrevPreviewKey(previewKey);if(open){setLoading(true);setError(null);}}
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  void (async()=>{
   try{
    const response=await fetch("/api/courses/quizzes/"+encodeURIComponent(quizId)+
     "?deliveryId="+encodeURIComponent(deliveryId),{cache:"no-store",signal:controller.signal});
    if(!response.ok)throw new Error("Quiz preview unavailable. Refresh and try again.");
    const body:unknown=await response.json();
    const result=body&&typeof body==="object"&&"quiz" in body?
     (body as {quiz:unknown}).quiz:null;
    if(!result||typeof result!=="object"||!("questions" in result)||
       !Array.isArray(result.questions))throw new Error("Unable to read quiz preview.");
    if(!controller.signal.aborted)setPreview(result as Preview);
   }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to preview quiz.");}
   finally{if(!controller.signal.aborted)setLoading(false);}
  })();
  return ()=>controller.abort();
 },[open,quizId,deliveryId]);
 return <section className="mt-3 border-y border-[var(--lms-canvas-border)] bg-transparent py-3">
  <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-[var(--lms-control-height)]" onClick={()=>setOpen(v=>!v)}
   aria-expanded={open}>{open?"Close Quiz Preview":"Preview Quiz"}</Button>
  {open?<div className="mt-3 space-y-3">
   <p className="text-xs text-muted-foreground">Preview only. No learner attempts are created.</p>
   {loading?<p role="status" className="text-sm">Loading quiz…</p>:null}
   {error?<Alert tone="error">{error}</Alert>:null}
   {preview?<><label className="flex min-h-11 items-center gap-2 text-[13px] md:min-h-[var(--lms-control-height)]">
    <Checkbox checked={answers} onChange={e=>setAnswers(e.target.checked)}/>
    Show answer key (faculty only)
   </label>
   {preview.questions.map((q,i)=><fieldset key={q.id} className="space-y-2 rounded-[var(--lms-canvas-radius)] border border-border p-3">
    <legend className="font-semibold text-sm">Question {i+1} · {q.points} points</legend>
    <p className="whitespace-pre-wrap break-words text-sm">{q.prompt}</p>
    {q.options.map(o=><label key={o.id} className="flex gap-2 text-sm">
     <ChoiceInput type={q.type==="SINGLE_CHOICE"?"radio":"checkbox"} disabled name={"preview-"+q.id}/>
     <span>{o.text}</span>
     {answers&&o.correct?<span className="text-success">(Correct)</span>:null}
    </label>)}
   </fieldset>)}
   {!preview.questions.length?<EmptyState title="No quiz questions yet." />:null}
   </>:null}
  </div>:null}
 </section>;
}
