"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
import { StatusBadge } from "@/components/ui/status-badge";
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
 const [viewAllSections,setViewAllSections]=useState(false);
 const [opened,setOpened]=useState(false),[loading,setLoading]=useState(false);
 const [attempts,setAttempts]=useState<Attempt[]>([]),[error,setError]=useState("");
 const [learnerSearch,setLearnerSearch]=useState("");
 const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
 const chosen=options.find(x=>x.deliveryId===deliveryId)??options[0];
 async function open(requestedPage=1){
  if(!chosen||loading)return;
  setOpened(true);setLoading(true);setError("");setAttempts([]);setPage(requestedPage);setHasMore(false);
  try{
   const response=await fetch("/api/courses/quiz-attempts?quizId="+encodeURIComponent(quizId)+
    "&deliveryId="+encodeURIComponent(chosen.deliveryId)+
    "&page="+requestedPage,{cache:"no-store"});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw Error("Could not load quiz attempts. Check your selected Section and try again.");
   if(!Array.isArray(data?.attempts)||typeof data?.hasMore!=="boolean"||
     !data.attempts.every((item:unknown)=>item!==null&&typeof item==="object"&&
       typeof (item as Attempt).id==="string"&&
       Array.isArray((item as Attempt).answers)))
    throw Error("Unexpected submissions response. Please retry.");
   setAttempts(data.attempts);setPage(requestedPage);setHasMore(Boolean(data.hasMore));
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not load quiz attempts.");}
  finally{setLoading(false);}
 }
 if(!options.length||status==="DRAFT")return null;
 return <div className="min-w-0 mt-2 space-y-2">
  {options.length>1?<label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
   <Select value={viewAllSections?"ALL":chosen.deliveryId} disabled={loading} onChange={e=>{
    const next=e.target.value;setViewAllSections(next==="ALL");
    if(next!=="ALL")setDeliveryId(next);
    setOpened(false);setAttempts([]);setLearnerSearch("");setPage(1);setHasMore(false);}}
    className="min-h-11 md:min-h-9">
    <option value="ALL">All sections (one section at a time)</option>
    {options.map(x=><option key={x.deliveryId} value={x.deliveryId}>{x.sectionName} ({x.sectionCode})</option>)}
   </Select></label>:null}
  {viewAllSections?<div className="space-y-4" aria-label="All quiz submission sections">
   <p className="text-xs text-muted-foreground">Every authorized Section is available below, with its own complete paged attempt history.</p>
   {options.map(option=><section key={option.deliveryId} className="border-b border-border pb-4">
    <h3 className="mb-2 text-sm font-semibold">{option.sectionName} ({option.sectionCode})</h3>
    <CollegeQuizAttempts quizId={quizId} offeringId={offeringId}
      specificDeliveryId={option.deliveryId} deliveries={[option]} status={status}/>
   </section>)}
  </div>:<>
  <Button variant="secondary" type="button" loading={loading} disabled={loading} onClick={()=>opened?setOpened(false):void open()}
   aria-expanded={opened} className="min-h-11 md:min-h-9">
   {opened?"Close submissions":loading?"Loading…":"Submissions"}
  </Button>
  {opened?<div role="region" aria-label="Quiz submissions, scroll for more attempts" tabIndex={0}
   className="max-h-80 overflow-y-auto overscroll-contain rounded border border-border bg-surface p-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
   {error?<Alert tone="error" className="flex-row flex-wrap items-center gap-2">{error}
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" disabled={loading} onClick={()=>void open(page)}>Retry</Button>
   </Alert>:null}
   {!loading&&!error&&attempts.length===0?<p className="text-xs text-muted-foreground leading-5">
    {page===1?"No quiz submissions yet for this Section.":"No further quiz submissions on this page."}</p>:null}
   {!loading&&attempts.length>0?<><p className="mb-2 text-xs font-semibold">{attempts.length} attempts</p>
    <label className="mb-[6px] grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search students on this page
     <Input type="search" value={learnerSearch} onChange={event=>setLearnerSearch(event.target.value)}
      className="min-h-11 md:min-h-9" placeholder="Student name or email"/>
    </label>
    {learnerSearch.trim()&&!attempts.some(item=>(item.learnerDisplayName??"").toLowerCase().includes(learnerSearch.trim().toLowerCase())||(item.learnerEmail??"").toLowerCase().includes(learnerSearch.trim().toLowerCase()))?
     <p className="text-xs text-muted-foreground leading-5">No students match your search.</p>:null}
    <ul className="divide-y divide-border border-y border-border">{attempts.filter(item=>!learnerSearch.trim()||
      (item.learnerDisplayName??"").toLowerCase().includes(learnerSearch.trim().toLowerCase())||
      (item.learnerEmail??"").toLowerCase().includes(learnerSearch.trim().toLowerCase())).map(item=><li key={item.id}
     className="space-y-1 py-3 text-xs">
     <p className="font-semibold text-foreground">{item.learnerDisplayName?.trim()||item.learnerEmail||"Learner "+item.membershipId.slice(0,8)}</p>
     <p>Attempt {item.attemptNumber} · {item.score}/{item.maxScore} points</p>
     <p className="text-muted-foreground">{new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.submittedAt))} IST</p>
    <Disclosure title={`View answers (${item.answers.length})`} className="mt-2 border-t border-border pt-2">
      {item.answers.length===0?<p className="mt-2 text-muted-foreground">No saved answers for this attempt.</p>:null}
      <ol className="mt-2 space-y-3">{item.answers.map((answer,index)=><li key={answer.id} className="border-b border-border py-2">
       <p className="font-semibold text-foreground">Question {index+1}: {answer.promptSnapshot}</p>
       <p className="flex flex-wrap items-center gap-2">{answer.pointsAwarded}/{answer.pointsPossible} points · <StatusBadge tone={answer.correct?"success":"error"}>{answer.correct?"Correct":"Incorrect"}</StatusBadge></p>
       <ul className="mt-1 space-y-1">{[...(answer.optionsSnapshot??[])].sort((a,b)=>a.sequence-b.sequence).map(option=><li key={option.id}>
        <span className={(answer.selectedOptionIds??[]).includes(option.id)?"font-semibold text-primary-text":""}>
         {(answer.selectedOptionIds??[]).includes(option.id)?"Selected: ":""}{option.text}
        </span>
        {option.correct?<span className="ml-2 text-success">(Correct answer)</span>:null}
       </li>)}</ul>
      </li>)}</ol>
     </Disclosure>
    </li>)}</ul>
   </>:null}
    {loading?<p role="status" className="mt-3 text-xs text-muted-foreground leading-5">Loading quiz submissions, page {page}…</p>:null}
    {!loading&&!error&&attempts.length>5?<p className="mt-2 text-xs text-muted-foreground leading-5">Scroll inside this panel to see more quiz submissions.</p>:null}
    {!loading&&!error?<nav aria-label="Quiz submission pages" className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
      <span>Page {page} · up to 25 attempts per page</span>
      <div className="flex items-center gap-3">
       <Button variant="secondary" type="button" disabled={loading||page<=1}
        onClick={()=>{setLearnerSearch("");void open(page-1);}}
        className="min-h-11 md:min-h-9">Previous</Button>
       <Button variant="secondary" type="button" disabled={loading||!hasMore}
        onClick={()=>{setLearnerSearch("");void open(page+1);}}
        className="min-h-11 md:min-h-9">Next</Button>
      </div>
     </nav>:null}
  </div>:null}
  </>}
 </div>;
}
