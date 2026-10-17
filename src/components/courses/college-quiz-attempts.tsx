"use client";
import {useState} from "react";
type Delivery={offeringId:string;deliveryId:string;sectionName:string;sectionCode:string};
type Attempt={id:string;membershipId:string;learnerDisplayName:string|null;learnerEmail:string|null;
 score:number;maxScore:number;attemptNumber:number;submittedAt:string;answers:{id:string}[]};
export function CollegeQuizAttempts({quizId,offeringId,specificDeliveryId,deliveries,status}:{
 quizId:string;offeringId:string;specificDeliveryId:string|null;deliveries:Delivery[];status:string;
}){
 const options=deliveries.filter(row=>row.offeringId===offeringId&&
  (!specificDeliveryId||row.deliveryId===specificDeliveryId));
 const [deliveryId,setDeliveryId]=useState(options[0]?.deliveryId??"");
 const [opened,setOpened]=useState(false),[loading,setLoading]=useState(false);
 const [attempts,setAttempts]=useState<Attempt[]>([]),[error,setError]=useState("");
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
    setDeliveryId(e.target.value);setOpened(false);setAttempts([]);}}
    className="min-h-10 rounded border border-border px-2">
    {options.map(x=><option key={x.deliveryId} value={x.deliveryId}>{x.sectionName} ({x.sectionCode})</option>)}
   </select></label>:null}
  <button type="button" disabled={loading} onClick={()=>opened?setOpened(false):void open()}
   aria-expanded={opened} className="min-h-10 rounded border border-border px-3 text-xs font-semibold text-primary-text">
   {opened?"Close submissions":loading?"Loading…":"Submissions"}
  </button>
  {opened?<div className="max-h-80 overflow-auto rounded border border-border bg-surface p-2">
   {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
   {!loading&&!error&&attempts.length===0?<p className="text-xs text-muted-foreground">
    No quiz submissions yet for this Section.</p>:null}
   {!loading&&attempts.length>0?<><p className="mb-2 text-xs font-semibold">{attempts.length} attempts</p>
    <ul className="space-y-2">{attempts.map(item=><li key={item.id}
     className="space-y-1 rounded border border-border p-2 text-xs">
     <p className="font-semibold">{item.learnerDisplayName?.trim()||item.learnerEmail||"Learner "+item.membershipId.slice(0,8)}</p>
     <p>Attempt {item.attemptNumber} · {item.score}/{item.maxScore} points</p>
     <p className="text-muted-foreground">{new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.submittedAt))} IST</p>
    </li>)}</ul>
   </>:null}
  </div>:null}
 </div>;
}
