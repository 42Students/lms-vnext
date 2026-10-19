"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {CollegeQuizQuestionsEditor} from "./college-quiz-questions-editor";
type Quiz={id:string;title:string;status:string;dueAt:Date|null};
function istInput(date:Date|null){
 if(!date)return "";
 return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",
  day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(date)).replace(" ","T");
}
export function CollegeQuizActions({quiz}:{quiz:Quiz}){
 const router=useRouter();
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [title,setTitle]=useState(quiz.title),[due,setDue]=useState(istInput(quiz.dueAt));
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [description,setDescription]=useState(""),[maxAttempts,setMaxAttempts]=useState(1);
 const [shuffleQuestions,setShuffleQuestions]=useState(false),[shuffleOptions,setShuffleOptions]=useState(false);
 const [expectedUpdatedAt,setExpectedUpdatedAt]=useState("");
 async function beginEdit(){
  if(busy||loading)return;
  if(editing){setEditing(false);return;}
  setError("");setNotice("");setExpectedUpdatedAt("");setLoading(true);
  try{
   const response=await fetch("/api/courses/quizzes/"+encodeURIComponent(quiz.id),{cache:"no-store"});
   const payload=await response.json().catch(()=>null);
   if(!response.ok||payload?.quiz?.quiz?.id!==quiz.id)
    throw Error("Unable to load Quiz metadata. Refresh this page and try again.");
   const current=payload.quiz.quiz;
   setTitle(current.title);setDescription(current.description??"");
   setDue(istInput(current.dueAt));setMaxAttempts(current.maxAttempts);
   setShuffleQuestions(Boolean(current.shuffleQuestions));setShuffleOptions(Boolean(current.shuffleOptions));
   setExpectedUpdatedAt(current.updatedAt);setEditing(true);
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to load Quiz metadata.");}
  finally{setLoading(false);}
 }
 async function act(action:"EDIT"|"ARCHIVE"){
  if(busy)return;
  let url="/api/courses/quizzes/"+encodeURIComponent(quiz.id);
  let method="PATCH",body:unknown;
  if(action==="EDIT"){
   if(!expectedUpdatedAt){setError("Reload the Quiz before editing.");return;}
   if(!title.trim()||title.trim().length>255){setError("Enter a quiz title.");return;}
   if(quiz.status==="DRAFT"&&(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>20)){
    setError("Maximum attempts must be between 1 and 20.");return;
   }
   const deadline=due?new Date(due+":00+05:30"):null;
   if(deadline&&Number.isNaN(deadline.getTime())){setError("Enter a valid deadline.");return;}
   body={title:title.trim(),
    ...(quiz.status==="DRAFT"||istInput(quiz.dueAt)!==due?{dueAt:deadline?.toISOString()??null}:{}),
    description:description.trim()||null,
    expectedUpdatedAt,
    ...(quiz.status==="DRAFT"?{maxAttempts,shuffleQuestions,shuffleOptions}:{})};
  }else{
   if(!window.confirm("Delete this quiz? Quizzes with learner attempts cannot be archived."))return;
   url+="/transition";method="POST";body={action:"ARCHIVE"};
  }
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(url,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(
    data?.error==="QUIZ_HAS_ATTEMPTS"?
     "Learners have attempted this Quiz or it is closed. Its deadline, questions, attempt limit and shuffle rules cannot be changed.":
    data?.error==="QUIZ_MAX_ATTEMPTS_REACHED"?
     "The maximum attempts cannot be lower than attempts already recorded.":
    data?.error==="FACULTY_QUIZ_STALE_VERSION"?
     "Another author changed this Quiz. Close the editor and reload its latest revision.":
    "Unable to update quiz. Check the form and try again.");
   setEditing(false);setExpectedUpdatedAt("");setNotice(action==="EDIT"?"Quiz updated.":"Quiz deleted.");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update quiz.");}
  finally{setBusy(false);}
 }
 if(quiz.status==="ARCHIVED")return null;
 return <div className="mt-2 space-y-2">
  <div className="flex flex-wrap gap-2">
   <Button type="button" disabled={busy||loading} onClick={()=>void beginEdit()}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">
    {loading?"Loading…":"Edit metadata"}</Button>
   <Button type="button" disabled={busy} onClick={()=>void act("ARCHIVE")}
    className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-error">
    Delete</Button>
  </div>
  {quiz.status==="DRAFT"?<CollegeQuizQuestionsEditor quizId={quiz.id}/>:null}
  {editing?<div className="grid gap-2 rounded border border-border p-3">
   <label className="grid gap-1 text-xs font-semibold">Quiz title
    <Input required maxLength={255} value={title} disabled={busy}
     onChange={e=>setTitle(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
   <label className="grid gap-1 text-xs font-semibold">Description
    <Textarea maxLength={10000} rows={3} value={description} disabled={busy}
     onChange={e=>setDescription(e.target.value)} className="rounded border border-border p-2"/>
   </label>
   {quiz.status==="DRAFT"?<label className="grid gap-1 text-xs font-semibold">Maximum attempts
    <Input type="number" min={1} max={20} value={maxAttempts} disabled={busy}
     onChange={e=>setMaxAttempts(Number(e.target.value))} className="min-h-10 rounded border border-border px-2"/>
   </label>:null}
   <label className="grid gap-1 text-xs font-semibold">Deadline (IST)
    <Input type="datetime-local" value={due} disabled={busy} onChange={e=>setDue(e.target.value)}
     className="min-h-10 rounded border border-border px-2"/></label>
   {quiz.status==="DRAFT"?<div className="grid gap-2 text-xs font-semibold">
    <label className="flex items-center gap-2"><Checkbox checked={shuffleQuestions}
     disabled={busy} onChange={e=>setShuffleQuestions(e.target.checked)}/>
     Shuffle question order per learner</label>
    <label className="flex items-center gap-2"><Checkbox checked={shuffleOptions}
     disabled={busy} onChange={e=>setShuffleOptions(e.target.checked)}/>
     Shuffle answer options per learner</label>
   </div>:null}
   {quiz.status!=="DRAFT"?<p className="text-xs text-muted-foreground">
    Quiz deadlines cannot be changed after learner attempts or after the quiz closes.
    Other immutable quiz fields stay unchanged.
   </p>:null}
   <Button type="button" disabled={busy} onClick={()=>void act("EDIT")}
    className="min-h-10 rounded bg-primary px-3 text-xs font-semibold text-on-primary">
    {busy?"Saving…":"Save quiz"}</Button>
  </div>:null}
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  {notice?<p role="status" className="text-xs text-success">{notice}</p>:null}
 </div>;
}
