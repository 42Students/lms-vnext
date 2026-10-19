"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";

/** Wall-clock read kept out of render bodies (React purity rule). */
function currentTimeMs(){return Date.now();}

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
 const [opened,setOpened]=useState(false),[keepOpen,setKeepOpen]=useState(false),[lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [deliveryId,setDeliveryId]=useState("");
 const [title,setTitle]=useState(""),[description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState(""),[maxAttempts,setMaxAttempts]=useState("1");
 const [shuffleQuestions,setShuffleQuestions]=useState(false),[shuffleOptions,setShuffleOptions]=useState(false);
 const [questions,setQuestions]=useState<Question[]>([empty()]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const lock=useRef(false),lesson=lessons.find(x=>x.id===lessonId);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const sections=deliveries.filter(x=>x.offeringId===lesson?.offeringId);
 function moveQuestion(index:number,delta:-1|1){
  setQuestions(rows=>{
   const next=index+delta;
   if(next<0||next>=rows.length)return rows;
   const copy=[...rows];
   [copy[index],copy[next]]=[copy[next],copy[index]];
   return copy;
  });
 }
 function replaceQuestion(i:number,updated:Question){
  setQuestions(rows=>rows.map((row,index)=>index===i?updated:row));
 }
 function valid(){
  if(!title.trim()||!lesson||(nextOverride[lesson.id]??lesson.nextSequence)>10000)
   return "Select a lesson and enter a quiz title.";
  if(deliveryId&&!sections.some(x=>x.deliveryId===deliveryId))return "Choose a Section within this offering.";
  const attempts=Number(maxAttempts);
  if(!Number.isInteger(attempts)||attempts<1||attempts>20)return "Attempts must be 1–20.";
  if(questions.length<1||questions.length>100)return "Add 1–100 questions.";
  for(let i=0;i<questions.length;i++){
   const q=questions[i],texts=q.options.map(x=>x.text.trim());
   if(!q.prompt.trim()||q.prompt.length>5000||!Number.isInteger(q.points)||q.points<1||q.points>1000||
      texts.some(x=>!x||x.length>2000)||new Set(texts.map(x=>x.toLocaleLowerCase())).size!==texts.length||
      texts.length<2||texts.length>20)return "Complete all question prompts, points and unique options.";
   const correct=q.options.filter(x=>x.correct).length;
   if(q.type==="SINGLE_CHOICE"&&correct!==1)return "Choose exactly one correct answer for each single-choice question.";
   if(q.type==="MULTIPLE_CHOICE"&&(correct<1||correct>=q.options.length))
    return "Choose at least one correct and one incorrect answer for each multiple-choice question.";
  }
  if(questions.reduce((sum,q)=>sum+q.points,0)>10000)return "Quiz total points may not exceed 10000.";
  if(dueAt&&!parseCollegeIstLocal(dueAt))return "Use a valid deadline.";
  if(dueAt&&Date.parse(parseCollegeIstLocal(dueAt)!)<=currentTimeMs())return "Quiz deadline must be in the future.";
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
     description:description.trim()||null,dueAt:dueAt?parseCollegeIstLocal(dueAt):null,
     maxAttempts:Number(maxAttempts),shuffleQuestions,shuffleOptions,sequence:nextOverride[lesson!.id]??lesson!.nextSequence,
     questions:questions.map((q,index)=>({...q,sequence:index,
      prompt:q.prompt.trim(),options:q.options.map((o,j)=>({...o,text:o.text.trim(),sequence:j}))}))})});
   const body=await result.json().catch(()=>null);
   if(!result.ok||!body?.quiz?.id)throw new Error(body?.error??"Could not create quiz.");
   setNextOverride(old=>({...old,[lesson!.id]:(old[lesson!.id]??lesson!.nextSequence)+1}));
   if(!keepOpen)setOpened(false);
   setTitle("");setDescription("");setDueAt("");setMaxAttempts("1");
   setShuffleQuestions(false);setShuffleOptions(false);setQuestions([empty()]);
   setNotice("Quiz draft created. Publish it when the questions are ready.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not create quiz.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h2 className="font-semibold">Quizzes</h2>
    <p className="text-xs text-muted-foreground">Author questions for all eligible Sections or a specific Section.</p></div>
   <Button variant="secondary" type="button" disabled={!lessons.length||busy} onClick={()=>{setError("");setNotice("");setOpened(true);}}
    className="min-h-10 px-3">
    Create New Quiz</Button>
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
     <Input maxLength={255} required value={title} disabled={busy}
      onChange={e=>setTitle(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold">Deadline (IST, required before publishing)
     <Input type="datetime-local" value={dueAt} disabled={busy} onChange={e=>setDueAt(e.target.value)}
      className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold">Maximum attempts
     <Input type="number" min={1} max={20} value={maxAttempts} disabled={busy}
      onChange={e=>setMaxAttempts(e.target.value)} className="min-h-10 rounded border border-border px-2"/></label>
    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Description
     <Textarea rows={2} maxLength={10000} value={description} disabled={busy}
      onChange={e=>setDescription(e.target.value)} className="rounded border border-border p-2"/></label>
   </div>
   <p role="status" className="text-xs text-muted-foreground">Audience: {deliveryId?
    sections.find(section=>section.deliveryId===deliveryId)?.sectionName??"Invalid Section":
    "All currently eligible Sections in the Course Offering"} · Draft quiz is hidden until published.</p>
   <div className="flex flex-wrap gap-4 text-sm">
    <label className="flex items-center gap-2"><input type="checkbox" checked={shuffleQuestions}
      onChange={e=>setShuffleQuestions(e.target.checked)}/>Shuffle question order per learner</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={shuffleOptions}
      onChange={e=>setShuffleOptions(e.target.checked)}/>Shuffle answer options per learner</label>
   </div>
   <p role="status" className="text-sm text-muted-foreground">{questions.length} question(s) ·
    {questions.reduce((sum,question)=>sum+question.points,0)} total points · Max 100 questions and 10,000 points.</p>
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
     <Input type="number" min={1} max={1000} aria-label="Question points" disabled={busy}
      value={question.points} onChange={e=>replaceQuestion(i,{...question,points:Number(e.target.value)})}
      className="w-28 rounded border border-border px-2"/>
    </div>
    <Textarea value={question.prompt} maxLength={5000} disabled={busy} placeholder="Question prompt"
     aria-label={"Question "+(i+1)+" prompt"} onChange={e=>replaceQuestion(i,{...question,prompt:e.target.value})}
     className="w-full rounded border border-border p-2"/>
    {question.options.map((option,j)=><label key={j} className="flex items-center gap-2 text-sm">
     <input type={question.type==="SINGLE_CHOICE"?"radio":"checkbox"}
      name={"quiz-correct-"+i} checked={option.correct} disabled={busy}
      aria-label={"Correct answer "+(j+1)} onChange={e=>replaceQuestion(i,{...question,
       options:question.options.map((o,k)=>({...o,correct:question.type==="SINGLE_CHOICE"?
        k===j:k===j?e.target.checked:o.correct}))})}/>
     <Input maxLength={2000} disabled={busy} value={option.text} placeholder={"Option "+(j+1)}
      onChange={e=>replaceQuestion(i,{...question,options:question.options.map((o,k)=>k===j?{...o,text:e.target.value}:o)})}
      className="min-h-10 min-w-0 flex-1 rounded border border-border px-2"/>
     {question.options.length>2?<Button variant="ghost" type="button" disabled={busy} onClick={()=>replaceQuestion(i,{
      ...question,options:question.options.filter((_,k)=>k!==j)})}
      >Remove</Button>:null}
    </label>)}
    <div className="flex flex-wrap gap-3">
     <Button variant="ghost" type="button" disabled={busy||i===0} onClick={()=>moveQuestion(i,-1)}
      >Move question up</Button>
     <Button variant="ghost" type="button" disabled={busy||i===questions.length-1} onClick={()=>moveQuestion(i,1)}
      >Move question down</Button>
     <Button variant="ghost" type="button" disabled={busy||question.options.length>=20}
      onClick={()=>replaceQuestion(i,{...question,options:[...question.options,{text:"",correct:false}]})}
      >+ Add option</Button>
     {questions.length>1?<Button variant="ghost" type="button" disabled={busy}
      onClick={()=>setQuestions(rows=>rows.filter((_,k)=>k!==i))}
      >Remove question</Button>:null}
    </div>
   </fieldset>)}
   <Button variant="secondary" type="button" disabled={busy||questions.length>=100}
    onClick={()=>setQuestions(rows=>[...rows,empty()])}
    className="min-h-10 px-3">
    + Add question</Button>
   <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" disabled={busy} checked={keepOpen} onChange={event=>setKeepOpen(event.target.checked)}/>
    Create another quiz after saving
   </label>
   <div className="flex flex-wrap gap-2">
    <Button variant="primary" type="button" disabled={busy} onClick={()=>void create()}
     className="min-h-10 px-4">
     {busy?"Saving…":"Create quiz draft"}</Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>{
      const dirty=Boolean(title.trim()||description.trim()||dueAt||deliveryId||
       maxAttempts!=="1"||shuffleQuestions||shuffleOptions||questions.length!==1||
       questions.some(q=>q.prompt.trim()||q.type!=="SINGLE_CHOICE"||q.points!==1||
        q.options.length!==2||q.options.some(option=>option.text.trim())));
      if(dirty&&!window.confirm("Discard unsaved quiz changes?"))return;
      setOpened(false);setTitle("");setDescription("");setDueAt("");setDeliveryId("");
      setMaxAttempts("1");setShuffleQuestions(false);setShuffleOptions(false);
      setQuestions([empty()]);setError("");
    }} className="min-h-10 px-4">Cancel</Button>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
 </section>;
}
