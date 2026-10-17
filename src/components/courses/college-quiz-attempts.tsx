"use client";
import {useState} from "react";
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};
type Answer={id:string;promptSnapshot:string;questionType:string;pointsPossible:number;pointsAwarded:number;
 correct:boolean;selectedOptionIds:string[];optionsSnapshot:{id:string;text:string;sequence:number;correct:boolean}[]};
type Attempt={id:string;membershipId:string;learnerDisplayName:string|null;learnerEmail:string|null;
 score:number;maxScore:number;attemptNumber:number;submittedAt:string;answers:Answer[]};
export function CollegeQuizAttempts({quizId,offeringId,specificDeliveryId,deliveries,status}:{
 quizId:string;offeringId:string;specificDeliveryId:string|null;deliveries:Delivery[];status:string;
}){
 const options=deliveries.filter(row=>row.offeringId===offeringId&&
  (!specificDeliveryId||row.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const [opened,setOpened]=useState(false),[loading,setLoading]=useState(false);
 const [attempts,setAttempts]=useState<Attempt[]>([]),[error,setError]=useState("");
 const [learnerSearch,setLearnerSearch]=useState("");
 const chosen=options.find(x=>x.deliveryId===deliveryId)??options[0];
 async function open(){
  if(!chosen||loading)return;
  setOpened(true);setLoading(true);setError("");setAttempts([]);
  try{
   const response=await fetch("/api/courses/quiz-attempts?quizId="+encodeURIComponent(quizId)+
    "&deliveryId="+encodeURIComponent(chosen.deliveryId),{cache:"no-store"});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!Array.isArray(data?.attempts))
    throw Error(typeof data?.error==="string"?data.error:"Could not load quiz attempts.");
   setAttempts(data.attempts);
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not load quiz attempts.");}
  finally{setLoading(false);}
 }
 if(!options.length||status==="DRAFT")return null;
 return <div className="mt-2 space-y-2">
  {options.length>1?<label className="grid gap-1 text-xs font-semibold">Section
   <select value={chosen.deliveryId} disabled={loading} onChange={e=>{
    setDeliveryId(e.target.value);setOpened(false);setAttempts([]);setLearnerSearch("");}}
    className="min-h-10 rounded border border-border px-2">
    {options.map(x=><option key={x.deliveryId} value={x.deliveryId}>{x.sectionName} ({x.sectionCode})</option>)}
   </select></label>:null}
  <button type="button" disabled={loading} onClick={()=>opened?setOpened(false):void open()}
   aria-expanded={opened} className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">
   {opened?"Close submissions":loading?"Loading…":"Submissions"}
  </button>
  {opened?<div className="max-h-80 overflow-auto rounded border border-border bg-surface p-2">
   {error?<div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-error">{error}
    <button type="button" className="underline" disabled={loading} onClick={()=>void open()}>Retry</button>
   </div>:null}
   {!loading&&!error&&attempts.length===0?<p className="text-xs text-muted-foreground">
    No quiz submissions yet for this Section.</p>:null}
   {!loading&&attempts.length>0?<><p className="mb-2 text-xs font-semibold">{attempts.length} attempts</p>
    <label className="mb-2 grid gap-1 text-xs font-semibold">Search Student
     <input type="search" value={learnerSearch} onChange={event=>setLearnerSearch(event.target.value)}
      className="min-h-10 rounded border border-border bg-background p-2" placeholder="Student name or email"/>
    </label>
    <ul className="space-y-2">{attempts.filter(item=>!learnerSearch.trim()||
      (item.learnerDisplayName??"").toLowerCase().includes(learnerSearch.trim().toLowerCase())||
      (item.learnerEmail??"").toLowerCase().includes(learnerSearch.trim().toLowerCase())).map(item=><li key={item.id}
     className="space-y-1 rounded border border-border p-2 text-xs">
     <p className="font-semibold">{item.learnerDisplayName?.trim()||item.learnerEmail||"Learner "+item.membershipId.slice(0,8)}</p>
     <p>Attempt {item.attemptNumber} · {item.score}/{item.maxScore} points</p>
     <p className="text-muted-foreground">{new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.submittedAt))} IST</p>
    <details className="mt-2 rounded border border-border p-2">
      <summary className="cursor-pointer font-semibold">View Answers ({item.answers.length})</summary>
      {item.answers.length===0?<p className="mt-2 text-muted-foreground">No saved answers for this attempt.</p>:null}
      <ol className="mt-2 space-y-3">{item.answers.map((answer,index)=><li key={answer.id} className="rounded border border-border p-2">
       <p className="font-semibold">Question {index+1}: {answer.promptSnapshot}</p>
       <p>{answer.pointsAwarded}/{answer.pointsPossible} points · {answer.correct?"Correct":"Incorrect"}</p>
       <ul className="mt-1 space-y-1">{[...(answer.optionsSnapshot??[])].sort((a,b)=>a.sequence-b.sequence).map(option=><li key={option.id}>
        <span className={(answer.selectedOptionIds??[]).includes(option.id)?"font-semibold text-primary-text":""}>
         {(answer.selectedOptionIds??[]).includes(option.id)?"Selected: ":""}{option.text}
        </span>
        {option.correct?<span className="ml-2 text-success">(Correct answer)</span>:null}
       </li>)}</ul>
      </li>)}</ol>
     </details>
    </li>)}</ul>
   </>:null}
  </div>:null}
 </div>;
}
