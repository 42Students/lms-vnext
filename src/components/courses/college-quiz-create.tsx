"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};
type Option={text:string;correct:boolean};
type Question={type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;options:Option[]};
const empty=():Question=>({type:"SINGLE_CHOICE",prompt:"",points:1,
 options:[{text:"",correct:true},{text:"",correct:false}]});
export function CollegeQuizCreate({lessons,deliveries}:{
 lessons:readonly Lesson[];deliveries:readonly Delivery[];
}){
 const router=useRouter();
 const [opened,setOpened]=useState(false),[lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [deliveryId,setDeliveryId]=useState("");
 const [title,setTitle]=useState(""),[description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState(""),[maxAttempts,setMaxAttempts]=useState("1");
 const [shuffleQuestions,setShuffleQuestions]=useState(false),[shuffleOptions,setShuffleOptions]=useState(false);
 const [questions,setQuestions]=useState<Question[]>([empty()]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const lock=useRef(false),lesson=lessons.find(x=>x.id===lessonId);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const sections=deliveries.filter(x=>x.offeringId===lesson?.offeringId);
 function replaceQuestion(i:number,updated:Question){
  setQuestions(rows=>rows.map((row,index)=>index===i?updated:row));
 }
 function valid(){
  if(!title.trim()||!lesson||lesson.nextSequence>10000)return "Select a lesson and enter a quiz title.";
  if(deliveryId&&!sections.some(x=>x.deliveryId===deliveryId))return "Choose a Section within this offering.";
  const attempts=Number(maxAttempts);
  if(!Number.isInteger(attempts)||attempts<1||attempts>20)return "Attempts must be 1–20.";
  if(questions.length<1||questions.length>100)return "Add 1–100 questions.";
  for(let i=0;i<questions.length;i++){
   const q=questions[i],texts=q.options.map(x=>x.text.trim());
   if(!q.prompt.trim()||!Number.isInteger(q.points)||q.points<1||q.points>1000||
      texts.some(x=>!x)||new Set(texts.map(x=>x.toLowerCase())).size!==texts.length||
      texts.length<2||texts.length>20)return "Complete all question prompts, points and unique options.";
   const correct=q.options.filter(x=>x.correct).length;
   if(!correct||(q.type==="SINGLE_CHOICE"&&correct!==1)||
      (q.type==="MULTIPLE_CHOICE"&&correct>=q.options.length))return "Select at least one correct and one incorrect answer for each multiple-choice question.";
  }
  if(questions.reduce((sum,q)=>sum+q.points,0)>10000)return "Quiz total points may not exceed 10000.";
  if(dueAt&&Number.isNaN(new Date(dueAt+":00+05:30").getTime()))return "Use a valid deadline.";
  if(dueAt&&new Date(dueAt+":00+05:30").getTime()<=Date.now())return "Quiz deadline must be in the future.";
  return null;
 }
 async function create(){
  if(lock.current)return;
  const problem=valid();if(problem){setError(problem);return;}
  if(!window.confirm("Create this quiz as a draft? Learners will not see it until published."))return;
  lock.current=true;setBusy(true);setError("");setNotice("");
  try{
   const result=await fetch("/api/courses/quizzes",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonId:lesson!.id,deliveryId:deliveryId||null,title:title.trim(),
     description:description.trim()||null,dueAt:dueAt?new Date(dueAt+":00+05:30").toISOString():null,
     maxAttempts:Number(maxAttempts),shuffleQuestions,shuffleOptions,sequence:nextOverride[lesson!.id]??lesson!.nextSequence,
     questions:questions.map((q,index)=>({...q,sequence:index,
      prompt:q.prompt.trim(),options:q.options.map((o,j)=>({...o,text:o.text.trim(),sequence:j}))}))})});
   const body=await result.json().catch(()=>null);
   if(!result.ok||!body?.quiz?.id)throw new Error(body?.error??"Could not create quiz.");
   setNextOverride(old=>({...old,[lesson!.id]:(old[lesson!.id]??lesson!.nextSequence)+1}));
   setOpened(false);setTitle("");setDescription("");setDueAt("");setQuestions([empty()]);
   setNotice("Quiz draft created. Publish it when the questions are ready.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create quiz.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h2 className="font-semibold">Quizzes</h2>
    <p className="text-xs text-muted-foreground">Author questions for all eligible Sections or a specific Section.</p></div>
   <button type="button" disabled={!lessons.length||busy} onClick={()=>setOpened(true)}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">
    Create New Quiz</button>
  </div>
  {!lessons.length?<p className="text-sm text-muted-foreground">Create an active course lesson before adding quizzes.</p>:null}
  {opened?<div className="space-y-3">
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-sm font-semibold">Course / Lesson
     <select value={lessonId} disabled={busy} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}}
      className="min-h-10 rounded border border-border p-2">
      {lessons.map(x=><option key={x.id} value={x.id}>{x.courseCode} · {x.course} · {x.name}</option>)}
     </select></label>
    <label className="grid gap-1 text-sm font-semibold">Audience
     <select value={deliveryId} disabled={busy} onChange={e=>setDeliveryId(e.target.value)}
      className="min-h-10 rounded border border-border p-2">
      <option value="">All currently eligible sections</option>
      {sections.map(x=><option key={x.deliveryId} value={x.deliveryId}>
       {x.sectionName} ({x.sectionCode})</option>)}
     </select></label>
    <label className="grid gap-1 text-sm font-semibold">Title
     <input maxLength={255} required value={title} disabled={busy}
      onChange={e=>setTitle(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold">Deadline (IST)
     <input type="datetime-local" value={dueAt} disabled={busy} onChange={e=>setDueAt(e.target.value)}
      className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold">Maximum attempts
     <input type="number" min={1} max={20} value={maxAttempts} disabled={busy}
      onChange={e=>setMaxAttempts(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Description
     <textarea rows={2} maxLength={10000} value={description} disabled={busy}
      onChange={e=>setDescription(e.target.value)} className="rounded border border-border p-2"/></label>
   </div>
   <div className="flex flex-wrap gap-4 text-sm">
    <label className="flex items-center gap-2"><input type="checkbox" checked={shuffleQuestions}
      onChange={e=>setShuffleQuestions(e.target.checked)}/>Shuffle question order per learner</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={shuffleOptions}
      onChange={e=>setShuffleOptions(e.target.checked)}/>Shuffle answer options per learner</label>
   </div>
   {questions.map((question,i)=><fieldset key={i} className="space-y-2 rounded border border-border p-3">
    <legend className="text-sm font-semibold">Question {i+1}</legend>
    <div className="flex flex-wrap gap-2">
     <select value={question.type} disabled={busy} onChange={e=>{
      const type=e.target.value as Question["type"];
      replaceQuestion(i,{...question,type,options:question.options.map((o,j)=>({...o,correct:j===0}))});
     }} className="min-h-10 rounded border border-border px-2">
      <option value="SINGLE_CHOICE">Single choice</option>
      <option value="MULTIPLE_CHOICE">Multiple choice</option>
     </select>
     <input type="number" min={1} max={1000} aria-label="Question points" disabled={busy}
      value={question.points} onChange={e=>replaceQuestion(i,{...question,points:Number(e.target.value)})}
      className="w-28 rounded border border-border px-2"/>
    </div>
    <textarea value={question.prompt} maxLength={5000} disabled={busy} placeholder="Question prompt"
     aria-label={"Question "+(i+1)+" prompt"} onChange={e=>replaceQuestion(i,{...question,prompt:e.target.value})}
     className="w-full rounded border border-border p-2"/>
    {question.options.map((option,j)=><label key={j} className="flex items-center gap-2 text-sm">
     <input type={question.type==="SINGLE_CHOICE"?"radio":"checkbox"}
      name={"quiz-correct-"+i} checked={option.correct} disabled={busy}
      aria-label={"Correct answer "+(j+1)} onChange={e=>replaceQuestion(i,{...question,
       options:question.options.map((o,k)=>({...o,correct:question.type==="SINGLE_CHOICE"?
        k===j:k===j?e.target.checked:o.correct}))})}/>
     <input maxLength={2000} disabled={busy} value={option.text} placeholder={"Option "+(j+1)}
      onChange={e=>replaceQuestion(i,{...question,options:question.options.map((o,k)=>k===j?{...o,text:e.target.value}:o)})}
      className="min-h-10 min-w-0 flex-1 rounded border border-border px-2"/>
     {question.options.length>2?<button type="button" disabled={busy} onClick={()=>replaceQuestion(i,{
      ...question,options:question.options.filter((_,k)=>k!==j)})}
      className="text-xs font-semibold text-error">Remove</button>:null}
    </label>)}
    <div className="flex flex-wrap gap-3">
     <button type="button" disabled={busy||question.options.length>=20}
      onClick={()=>replaceQuestion(i,{...question,options:[...question.options,{text:"",correct:false}]})}
      className="text-sm font-semibold text-primary-text">+ Add option</button>
     {questions.length>1?<button type="button" disabled={busy}
      onClick={()=>setQuestions(rows=>rows.filter((_,k)=>k!==i))}
      className="text-sm font-semibold text-error">Remove question</button>:null}
    </div>
   </fieldset>)}
   <button type="button" disabled={busy||questions.length>=100}
    onClick={()=>setQuestions(rows=>[...rows,empty()])}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold text-primary-text">
    + Add question</button>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={busy} onClick={()=>void create()}
     className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary">
     {busy?"Saving…":"Create quiz draft"}</button>
    <button type="button" disabled={busy} onClick={()=>{
      if((title.trim()||questions.some(q=>q.prompt.trim()))&&!window.confirm("Discard unsaved quiz changes?"))return;
      setOpened(false);
    }} className="min-h-10 rounded border border-border px-4 text-sm">Cancel</button>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
 </section>;
}
