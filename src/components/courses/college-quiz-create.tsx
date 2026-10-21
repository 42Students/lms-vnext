"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { ChoiceInput } from "@/components/ui/choice-input";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Banner } from "@/components/ui/banner";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import {useEffect,useRef,useState} from "react";
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
 const {askConfirm,dialog}=useConfirmFlow();
 const router=useRouter();
 const [opened,setOpened]=useState(false),[keepOpen,setKeepOpen]=useState(false),[lessonId,setLessonId]=useState("");
 const [courseId,setCourseId]=useState("");
 const [courseSearch,setCourseSearch]=useState("");
 const courseOptions=[...new Map(lessons.map(item=>[item.offeringId,
  {id:item.offeringId,name:item.course,code:item.courseCode}])).values()];
 const eligibleLessons=lessons.filter(item=>item.offeringId===courseId);
 const [deliveryId,setDeliveryId]=useState("");
 const [title,setTitle]=useState(""),[description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState(""),[maxAttempts,setMaxAttempts]=useState("1");
 const [publishNow,setPublishNow]=useState(true);
 const [shuffleQuestions,setShuffleQuestions]=useState(false),[shuffleOptions,setShuffleOptions]=useState(false);
 const [questions,setQuestions]=useState<Question[]>([empty()]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const lock=useRef(false),lesson=lessons.find(x=>x.id===lessonId);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const sections=deliveries.filter(x=>x.offeringId===lesson?.offeringId);
 const dirty=Boolean(title.trim()||description.trim()||dueAt||deliveryId||
  maxAttempts!=="1"||!publishNow||shuffleQuestions||shuffleOptions||questions.length!==1||
  questions.some(q=>q.prompt.trim()||q.type!=="SINGLE_CHOICE"||q.points!==1||
   q.options.length!==2||q.options.some(option=>option.text.trim())));
 useEffect(()=>{
  if(!opened||!dirty)return;
  function warn(event:BeforeUnloadEvent){event.preventDefault();event.returnValue="";}
  window.addEventListener("beforeunload",warn);
  return()=>window.removeEventListener("beforeunload",warn);
 },[opened,dirty]);
 async function close(){
  if(busy)return;
  if(dirty&&!(await askConfirm("Your unsaved changes will be lost.")))return;
  setOpened(false);setTitle("");setDescription("");setDueAt("");setDeliveryId("");
  setMaxAttempts("1");setPublishNow(true);setShuffleQuestions(false);setShuffleOptions(false);
  setQuestions([empty()]);setError("");
 }
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
  if(!title.trim())return "Enter a quiz title";
  if(!lesson||(nextOverride[lesson.id]??lesson.nextSequence)>10000)
   return "Select a lesson before creating the quiz.";
  if(description.trim().length>5000)return "Quiz description may not exceed 5000 characters";
  if(!dueAt)return "Set a due date";
  if(deliveryId&&!sections.some(x=>x.deliveryId===deliveryId))return "Choose a Section within this offering.";
  const attempts=Number(maxAttempts);
  if(!Number.isInteger(attempts)||attempts<1||attempts>20)return "Attempts must be 1–20.";
  if(questions.length<1||questions.length>100)return "Add 1–100 questions.";
  for(let i=0;i<questions.length;i++){
   const q=questions[i],texts=q.options.map(x=>x.text.trim());
   if(!q.prompt.trim()||q.prompt.length>5000||!Number.isInteger(q.points)||q.points<1||q.points>100||
      texts.some(x=>!x||x.length>2000)||new Set(texts.map(x=>x.toLocaleLowerCase())).size!==texts.length||
      texts.length<2||texts.length>20)return "Complete all question prompts, points and unique options.";
   const correct=q.options.filter(x=>x.correct).length;
   if(q.type==="SINGLE_CHOICE"&&correct!==1)return "Choose exactly one correct answer for each single-choice question.";
   if(q.type==="MULTIPLE_CHOICE"&&correct<1)
    return "Choose at least one correct answer for each multiple-choice question.";
  }
  if(questions.reduce((sum,q)=>sum+q.points,0)>10000)return "Quiz total points may not exceed 10000.";
  if(!parseCollegeIstLocal(dueAt))return "Set a valid due date";
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:(?:00|05|10|15|20|25|30|35|40|45|50|55)$/.test(dueAt))
   return "Select a due time in 5-minute increments";
  if(Date.parse(parseCollegeIstLocal(dueAt)!)<=currentTimeMs())return "Quiz deadline must be in the future.";
  return null;
 }
 async function create(){
  if(lock.current)return;
  const problem=valid();if(problem){setError(problem);return;}
  if(!(await askConfirm(publishNow?
    "Create and publish this quiz now? Learners will be able to see it immediately.":
    "Create this quiz as a draft? Learners will not see it until published.")))return;
  lock.current=true;setBusy(true);setError("");setNotice("");
  try{
   const result=await fetch("/api/courses/quizzes",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({lessonId:lesson!.id,deliveryId:deliveryId||null,title:title.trim(),
     description:description.trim()||null,dueAt:parseCollegeIstLocal(dueAt),publishNow,
     maxAttempts:Number(maxAttempts),shuffleQuestions,shuffleOptions,sequence:nextOverride[lesson!.id]??lesson!.nextSequence,
     questions:questions.map((q,index)=>({...q,sequence:index,
      prompt:q.prompt.trim(),options:q.options.map((o,j)=>({...o,text:o.text.trim(),sequence:j}))}))})});
   const body=await result.json().catch(()=>null);
   if(!result.ok||!body?.quiz?.id)throw new Error(body?.error??"Could not create quiz.");
   setNextOverride(old=>({...old,[lesson!.id]:(old[lesson!.id]??lesson!.nextSequence)+1}));
   if(!keepOpen)setOpened(false);
   setTitle("");setDescription("");setDueAt("");setMaxAttempts("1");
   setShuffleQuestions(false);setShuffleOptions(false);setQuestions([empty()]);
   setPublishNow(true);
   setNotice(publishNow?"Quiz created and published":"Quiz created as a draft. Publish it when the questions are ready.");router.refresh();
  }catch(cause){setError("Quiz was not created. "+(cause instanceof Error?cause.message:"Check your entries and try again."));}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
  <div className="grid min-w-0 gap-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
   <label className="grid gap-1 text-sm font-semibold">Course for new quiz
    <Input type="search" value={courseSearch} placeholder="Search courses" aria-label="Search courses"
      onChange={event=>setCourseSearch(event.target.value)} className="min-h-11 md:min-h-9"/>
    <Select value={courseId} disabled={busy} onChange={event=>{
       setCourseId(event.target.value);setLessonId("");setDeliveryId("");
      }} className="min-h-11 md:min-h-9" aria-label="Course for new quiz">
      <option value="">All courses</option>
      {courseOptions.filter(item=>item.id===courseId||[item.name,item.code].join(" ")
        .toLocaleLowerCase("en-IN").includes(courseSearch.trim().toLocaleLowerCase("en-IN")))
        .map(item=><option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm font-semibold">Lesson for new quiz
    <Select value={lessonId} disabled={busy||!courseId}
      onChange={event=>{setLessonId(event.target.value);setDeliveryId("");}} className="min-h-11 md:min-h-9">
      <option value="">Lesson for new quiz</option>
      {eligibleLessons.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </Select>
   </label>
   <Button variant="primary" type="button" disabled={!courseId||!lessonId||busy} onClick={()=>{setError("");setNotice("");setOpened(true);}}
    className="min-h-11 w-full md:min-h-9 md:w-auto">
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="mr-2 inline-block">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>Create quiz
   </Button>
  </div>
  {!lessons.length?<Banner tone="warning">Courses or Lessons could not be loaded, or none are available.
    Create an active Lesson under a Course Offering before adding quizzes.
    <Button type="button" variant="ghost" size="sm" onClick={()=>router.refresh()}>Retry course and lesson lookup</Button>
  </Banner>:null}
  <Dialog open={opened} onOpenChange={open=>{if(!open)void close();}}
   title="Create quiz" description="Build and publish a quiz for the selected Course and Section."
   className="!w-[min(820px,94vw)] !max-w-[820px]" dismissible={!busy}>
   <div className="min-w-0 space-y-4">
   <div className="grid min-w-0 gap-4 md:grid-cols-2">
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Lesson for new quiz
     <Select value={lessonId} disabled={busy||!courseId} onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}}
      className="min-h-11 md:min-h-9">
      <option value="">Select lesson</option>
      {eligibleLessons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </Select></label>
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Audience
     <Select value={deliveryId} disabled={busy} onChange={e=>setDeliveryId(e.target.value)}
      className="min-h-11 md:min-h-9">
      <option value="">All currently eligible sections</option>
      {sections.map(x=><option key={x.deliveryId} value={x.deliveryId}>
       {x.sectionName} ({x.sectionCode})</option>)}
     </Select></label>
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Quiz title
     <Input maxLength={255} required placeholder="Example: Java basics checkpoint" value={title} disabled={busy}
      onChange={e=>setTitle(e.target.value)} className="min-h-11 md:min-h-9"/></label>
    <label className="grid gap-1 text-sm font-semibold leading-5 text-body">Deadline (IST)
     <DateInput mode="datetime-local" value={dueAt} disabled={busy} required step={300}
      onChange={e=>setDueAt(e.target.value)} className="min-h-11 md:min-h-9"/>
     {!dueAt?<span className="text-xs text-warning">Set a due date</span>:null}
   </label>
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Maximum attempts
     <Input type="number" min={1} max={20} value={maxAttempts} disabled={busy}
      onChange={e=>setMaxAttempts(e.target.value)} className="min-h-11 md:min-h-9"/></label>
    <label className="grid gap-[6px] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description
     <Textarea rows={2} maxLength={5000} value={description} disabled={busy}
      onChange={e=>setDescription(e.target.value)} className="min-h-11 md:min-h-9"/></label>
   </div>
   <p role="status" className="text-xs text-muted-foreground">Audience: {deliveryId?
    sections.find(section=>section.deliveryId===deliveryId)?.sectionName??"Invalid Section":
    "All currently eligible Sections in the Course Offering"} · {publishNow?"Publish now":"Save as draft"}.</p>
   <div className="grid min-w-0 gap-2 text-sm sm:grid-cols-3">
    <div><label className="flex min-h-11 items-center gap-2">
      <Checkbox checked={publishNow} disabled={busy} onChange={e=>setPublishNow(e.target.checked)}/>Publish now
     </label><p className="text-xs text-muted-foreground">Learners can see the quiz when published.</p></div>
    <div><label className="flex min-h-11 items-center gap-2">
      <Checkbox checked={shuffleQuestions} disabled={busy} onChange={e=>setShuffleQuestions(e.target.checked)}/>Shuffle questions
     </label><p className="text-xs text-muted-foreground">Each learner gets questions in a different order.</p></div>
    <div><label className="flex min-h-11 items-center gap-2">
      <Checkbox checked={shuffleOptions} disabled={busy} onChange={e=>setShuffleOptions(e.target.checked)}/>Shuffle options
     </label><p className="text-xs text-muted-foreground">Shuffle the answer options for each learner.</p></div>
   </div>
   <p role="status" className="text-sm text-muted-foreground">{questions.length} question(s) ·
    {questions.reduce((sum,question)=>sum+question.points,0)} total points · Max 100 questions and 10,000 points.</p>
   {questions.map((question,i)=><fieldset key={i} className="space-y-2 border-t border-border py-3">
    <legend className="text-sm font-semibold">Question {i+1}</legend>
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
     <fieldset className="flex flex-wrap items-center gap-3">
      <legend className="text-xs font-semibold text-muted-foreground">Type</legend>
      <label className="flex min-h-11 items-center gap-2 text-xs md:min-h-9">
       <ChoiceInput type="radio" name={"question-type-"+i} checked={question.type==="SINGLE_CHOICE"}
        disabled={busy} onChange={()=>replaceQuestion(i,{...question,type:"SINGLE_CHOICE",
         options:question.options.map((o,j)=>({...o,correct:j===0}))})}/>Single choice
      </label>
      <label className="flex min-h-11 items-center gap-2 text-xs md:min-h-9">
       <ChoiceInput type="radio" name={"question-type-"+i} checked={question.type==="MULTIPLE_CHOICE"}
        disabled={busy} onChange={()=>replaceQuestion(i,{...question,type:"MULTIPLE_CHOICE",
         options:question.options.map((o,j)=>({...o,correct:j===0}))})}/>Multiple choice
      </label>
     </fieldset>
     <Input type="number" min={1} max={100} aria-label="Question points" disabled={busy}
      value={question.points} onChange={e=>replaceQuestion(i,{...question,points:Number(e.target.value)})}
      className="min-h-11 w-full sm:w-28 md:min-h-9"/>
    </div>
    <label className="block text-xs font-semibold">Question
    <Textarea value={question.prompt} maxLength={5000} disabled={busy} placeholder="Question prompt"
     aria-label={"Question "+(i+1)+" prompt"} onChange={e=>replaceQuestion(i,{...question,prompt:e.target.value})}
     className="min-h-24 w-full"/></label>
    {question.options.map((option,j)=><label key={j} className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
     <ChoiceInput type={question.type==="SINGLE_CHOICE"?"radio":"checkbox"}
      name={"quiz-correct-"+i} checked={option.correct} disabled={busy}
      aria-label={"Correct answer "+(j+1)} onChange={e=>replaceQuestion(i,{...question,
       options:question.options.map((o,k)=>({...o,correct:question.type==="SINGLE_CHOICE"?
        k===j:k===j?e.target.checked:o.correct}))})}/>
     <Input maxLength={2000} disabled={busy} value={option.text} placeholder={"Option "+(j+1)}
      onChange={e=>replaceQuestion(i,{...question,options:question.options.map((o,k)=>k===j?{...o,text:e.target.value}:o)})}
      className="min-h-11 min-w-0 flex-1"/>
     {question.options.length>2?<Button variant="danger" type="button" disabled={busy} onClick={()=>replaceQuestion(i,{
      ...question,options:question.options.filter((_,k)=>k!==j)})}
      className="min-h-11 text-xs font-[650] md:min-h-9">Remove</Button>:null}
    </label>)}
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
     <Button variant="ghost" type="button" disabled={busy||i===0} onClick={()=>moveQuestion(i,-1)}
      className="min-h-11 w-full text-sm font-[650] text-primary-text disabled:opacity-50 sm:w-auto md:min-h-9">Move question up</Button>
     <Button variant="ghost" type="button" disabled={busy||i===questions.length-1} onClick={()=>moveQuestion(i,1)}
      className="min-h-11 w-full text-sm font-[650] text-primary-text disabled:opacity-50 sm:w-auto md:min-h-9">Move question down</Button>
     <Button variant="ghost" type="button" disabled={busy||question.options.length>=20}
      onClick={()=>replaceQuestion(i,{...question,options:[...question.options,{text:"",correct:false}]})}
      className="min-h-11 w-full text-sm font-[650] text-primary-text sm:w-auto md:min-h-9">+ Add option</Button>
     {questions.length>1?<Button variant="danger" type="button" disabled={busy}
      onClick={()=>setQuestions(rows=>rows.filter((_,k)=>k!==i))}
      className="min-h-11 w-full text-sm font-[650] sm:w-auto md:min-h-9">Remove question</Button>:null}
    </div>
   </fieldset>)}
   <Button variant="secondary" type="button" disabled={busy||questions.length>=100}
    onClick={()=>setQuestions(rows=>[...rows,empty()])}
    className="min-h-11 md:min-h-9">
    + Add question</Button>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox disabled={busy} checked={keepOpen} onChange={event=>setKeepOpen(event.target.checked)}/>
    Create another quiz after saving
   </label>
   {error?<Banner tone="error" role="alert">{error}</Banner>:null}
   <div className="sticky bottom-0 z-10 flex min-w-0 flex-col gap-2 border-t border-border bg-surface py-3 md:flex-row md:items-center">
    <Button variant="primary" type="button" loading={busy} disabled={busy} onClick={()=>void create()} className="min-h-11 w-full md:min-h-9 md:w-auto"
     >
     {busy?"Saving…":publishNow?"Create and publish":"Create quiz draft"}</Button>
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>void close()}
     className="min-h-11 w-full md:min-h-9 md:w-auto">Cancel</Button>
   </div>
  </div>
  </Dialog>
  {notice?<Banner tone="success">{notice}</Banner>:null}
  {dialog}
 </section>;
}
