"use client";

import {useEffect,useRef,useState} from "react";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {Disclosure} from "@/components/ui/disclosure";
import {StatusBadge} from "@/components/ui/status-badge";

type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};
type Answer={id:string;promptSnapshot:string;questionType:string;pointsPossible:number;pointsAwarded:number;
 correct:boolean;selectedOptionIds:string[];optionsSnapshot:{id:string;text:string;sequence:number;correct:boolean}[]};
type Attempt={id:string;membershipId:string;learnerDisplayName:string|null;learnerEmail:string|null;
 learnerRollNumber?:string|null;score:number;maxScore:number;attemptNumber:number;
 submittedAt:string;answers:Answer[]};

/** A quiz deadline already represents an absolute instant converted from the
 * author's Asia/Kolkata wall clock by the validated quiz API. Do not parse the
 * persisted instant a second time as if it were a local timestamp. */
function isLate(submittedAt:string,dueAt:string|null|undefined){
 if(!dueAt)return false;
 const submitted=Date.parse(submittedAt),due=Date.parse(dueAt);
 return Number.isFinite(submitted)&&Number.isFinite(due)&&submitted>due;
}
function submittedTime(value:string){
 const instant=new Date(value);
 return Number.isNaN(instant.getTime())?"Time unavailable":
  new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(instant)+" IST";
}
function QuizAttemptsSkeleton(){
 return <div aria-label="Loading quiz submissions" role="status">
  <p className="sr-only">Loading quiz submissions…</p>
  <ul aria-hidden="true" className="divide-y divide-border">
   {Array.from({length:6},(_,index)=><li key={index} className="flex items-center justify-between gap-3 py-3">
    <div className="grid flex-1 gap-2"><div className="h-4 w-36 animate-pulse rounded bg-border"/>
     <div className="h-3 w-52 max-w-full animate-pulse rounded bg-border"/></div>
    <div className="h-6 w-14 animate-pulse rounded bg-border"/>
   </li>)}
  </ul>
 </div>;
}

/** Rendered inside the shared 640px submissions Dialog supplied by the parent.
 * Its title, escape handling, focus trap, and opener restoration belong to that
 * one dialog; creating another nested modal would violate the legacy flow. */
export function CollegeQuizAttempts({quizId,offeringId,specificDeliveryId,deliveries,status,dueAt}:{
 quizId:string;offeringId:string;specificDeliveryId:string|null;
 deliveries:Delivery[];status:string;dueAt?:string|null;
}){
 const options=deliveries.filter(row=>row.offeringId===offeringId&&
  (!specificDeliveryId||row.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const chosen=options.find(row=>row.deliveryId===deliveryId)??options[0];
 const [attempts,setAttempts]=useState<Attempt[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [learnerSearch,setLearnerSearch]=useState("");
 const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
 const [retryKey,setRetryKey]=useState(0);
 const requestId=useRef(0);
 useEffect(()=>{
  if(!chosen||status==="DRAFT")return;
  const id=++requestId.current;
  const abort=new AbortController();
  setLoading(true);setError("");setAttempts([]);setHasMore(false);
  void (async()=>{
   try{
    const params=new URLSearchParams({quizId,deliveryId:chosen.deliveryId,page:String(page)});
    const response=await fetch("/api/courses/quiz-attempts?"+params.toString(),
     {cache:"no-store",signal:abort.signal});
    const data:unknown=await response.json().catch(()=>null);
    if(!response.ok)throw Error("Unable to load submissions");
    if(!data||typeof data!=="object"||!Array.isArray((data as {attempts?:unknown}).attempts)||
      typeof (data as {hasMore?:unknown}).hasMore!=="boolean"||
      !(data as {attempts:unknown[]}).attempts.every(item=>item!==null&&typeof item==="object"&&
        typeof (item as Attempt).id==="string"&&Array.isArray((item as Attempt).answers)))
     throw Error("Unexpected submissions response. Please retry.");
    if(id!==requestId.current||abort.signal.aborted)return;
    const parsed=data as {attempts:Attempt[];hasMore:boolean};
    setAttempts(parsed.attempts);setHasMore(parsed.hasMore);
   }catch(cause){
    if(id!==requestId.current||abort.signal.aborted)return;
    setError(cause instanceof Error?cause.message:"Failed to load submissions");
   }finally{
    if(id===requestId.current&&!abort.signal.aborted)setLoading(false);
   }
  })();
  return ()=>{abort.abort();requestId.current++;};
 },[quizId,chosen?.deliveryId,page,retryKey,status]);
 if(!options.length||status==="DRAFT")return null;
 const search=learnerSearch.trim().toLocaleLowerCase();
 const visible=attempts.filter(item=>!search||
  [item.learnerDisplayName??"",item.learnerRollNumber??"",item.learnerEmail??""]
    .some(value=>value.toLocaleLowerCase().includes(search)));
 return <div className="min-w-0 space-y-3" aria-label="Quiz submissions">
  {options.length>1?<label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
   Section
   <Select value={chosen?.deliveryId??""} disabled={loading} onChange={event=>{
    setDeliveryId(event.target.value);setPage(1);setLearnerSearch("");
   }} className="min-h-11 md:min-h-9">
    {options.map(option=><option key={option.deliveryId} value={option.deliveryId}>
     {option.sectionName} ({option.sectionCode})
    </option>)}
   </Select>
   <span className="text-xs font-normal text-muted-foreground">View one authorized Section at a time.</span>
  </label>:null}
  {error?<Alert tone="error" className="flex-row flex-wrap items-center gap-2">
   <span>Unable to load submissions. {error}</span>
   <Button variant="secondary" type="button" onClick={()=>setRetryKey(value=>value+1)}>Retry</Button>
  </Alert>:null}
  {loading?<QuizAttemptsSkeleton/>:null}
  {!loading&&!error&&attempts.length===0?<p role="status" className="py-6 text-center text-sm text-muted-foreground">
   {page===1?"No submissions yet":"No further submissions on this page."}
  </p>:null}
  {!loading&&!error&&attempts.length>0?<>
   <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">
    Search submissions on this page
    <Input type="search" value={learnerSearch} onChange={event=>setLearnerSearch(event.target.value)}
     placeholder="Student name or roll" className="min-h-11 md:min-h-9"/>
   </label>
   {search&&visible.length===0?<p role="status" className="text-sm text-muted-foreground">No students match your search.</p>:null}
   <ul className="divide-y divide-border">
    {visible.map(item=><li key={item.id} className="min-w-0 py-3">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
       <p className="font-semibold text-[var(--lms-heading)]">{item.learnerDisplayName?.trim()||"Learner "+item.membershipId.slice(0,8)}</p>
       {item.learnerRollNumber?.trim()?<p className="text-xs text-muted-foreground">Roll: {item.learnerRollNumber}</p>:null}
       <p className="text-xs text-muted-foreground">Submitted {submittedTime(item.submittedAt)}</p>
       <div className="flex flex-wrap gap-2">
        {item.attemptNumber>1?<StatusBadge tone="neutral">Attempt {item.attemptNumber}</StatusBadge>:null}
        {isLate(item.submittedAt,dueAt)?<StatusBadge tone="warning">Late</StatusBadge>:null}
       </div>
      </div>
      <StatusBadge tone="info">{item.score}/{item.maxScore}</StatusBadge>
     </div>
     <Disclosure title={"View answers ("+item.answers.length+")"} className="mt-2 border-t border-border pt-2">
      {item.answers.length===0?<p className="text-sm text-muted-foreground">No saved answers for this attempt.</p>:null}
      <ol className="mt-2 space-y-3">{item.answers.map((answer,index)=><li key={answer.id} className="border-b border-border py-2 text-sm">
       <p className="font-semibold text-foreground">Question {index+1}: {answer.promptSnapshot}</p>
       <p className="flex flex-wrap items-center gap-2">{answer.pointsAwarded}/{answer.pointsPossible} points ·
        <StatusBadge tone={answer.correct?"success":"error"}>{answer.correct?"Correct":"Incorrect"}</StatusBadge>
       </p>
       <ul className="mt-1 space-y-1">{[...(answer.optionsSnapshot??[])].sort((a,b)=>a.sequence-b.sequence).map(option=><li key={option.id}>
        <span className={(answer.selectedOptionIds??[]).includes(option.id)?"font-semibold text-primary-text":""}>
         {(answer.selectedOptionIds??[]).includes(option.id)?"Selected: ":""}{option.text}
        </span>
        {option.correct?<span className="ml-2 text-success">(Correct answer)</span>:null}
       </li>)}</ul>
      </li>)}</ol>
     </Disclosure>
    </li>)}
   </ul>
  </>:null}
  {!loading&&!error?<nav aria-label="Quiz submission pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
   <span>Page {page} · up to 25 attempts per page</span>
   <div className="flex items-center gap-2">
    <Button variant="secondary" type="button" disabled={page<=1}
     onClick={()=>{setLearnerSearch("");setPage(value=>Math.max(1,value-1));}}>Previous</Button>
    <Button variant="secondary" type="button" disabled={!hasMore}
     onClick={()=>{setLearnerSearch("");setPage(value=>value+1);}}>Next</Button>
   </div>
  </nav>:null}
 </div>;
}
