"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {aiGradingRubricForMaximum,type AiGradingSelection,type AiGradingRubric} from "@/modules/courses/faculty-ai-grading-model";
import {facultyAiGradingReportHref} from "@/modules/courses/faculty-ai-grading-links";
import {verifyFacultyAiGradingResult} from "@/modules/courses/faculty-ai-grading-result";
import {facultyAiGradingEvidenceReviewed,toggleFacultyAiGradingReview} from "@/modules/courses/faculty-ai-grading-review";
import {facultyAiGradingReviewReceipt} from "@/modules/courses/faculty-ai-grading-audit";

type Selected={
 id:string;version:number;submissionType:string;gradingStatus:string;
 gradePublished:boolean;textContent:string|null;learnerLabel:string;eligible:boolean;
};
export function FacultyAiGradingWorkbench({selection,maxPoints,submission}:{
 selection:AiGradingSelection & {submissionId:string};maxPoints:number;submission:Selected;
}){
 const [rubricText,setRubricText]=useState(()=>JSON.stringify({
  title:"Assignment review rubric",criteria:[{
   id:"criterion_1",title:"Content accuracy",description:"Identify and evaluate relevant evidence in the submitted answer.",
   maxPoints,
  }],
 },null,2));
 const [rubricError,setRubricError]=useState<string|null>(null);
 const [providerStatus,setProviderStatus]=useState<string|null>(null);
 const [requesting,setRequesting]=useState(false);
 const [permission,setPermission]=useState(false);
 const [suggestion,setSuggestion]=useState<ReturnType<typeof verifyFacultyAiGradingResult>["suggestion"]|null>(null);
 const [reviewed,setReviewed]=useState(false);
 const [reviewedEvidence,setReviewedEvidence]=useState<string[]>([]);
 const [draftPoints,setDraftPoints]=useState("");
 const [draftFeedback,setDraftFeedback]=useState("");
 const [receiptStatus,setReceiptStatus]=useState<string|null>(null);
 function parseRubric():AiGradingRubric|null{
  try{
   const result=aiGradingRubricForMaximum(JSON.parse(rubricText) as unknown,maxPoints);
   setRubricError(null);return result;
  }catch{setRubricError("Enter valid rubric JSON with unique criterion IDs and exactly "+maxPoints+" total points.");return null;}
 }
 function onRubricChange(value:string){
  setRubricText(value);setSuggestion(null);setReviewed(false);setReviewedEvidence([]);setRubricError(null);setProviderStatus(null);
 }
 async function requestSuggestion(){
  const rubric=parseRubric();
  if(!rubric||!permission||!submission.eligible||!submission.textContent)return;
  setSuggestion(null);setReviewed(false);setReviewedEvidence([]);setProviderStatus(null);setRequesting(true);
  try{
   const response=await fetch("/api/ai-grading/suggest",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({selection,expectedSubmissionVersion:submission.version,
     consentToApprovedProcessing:true,rubric}),
   });
   if(!response.ok){
    setProviderStatus(response.status===503?
     "AI provider is not enabled. No suggestion was produced and no grade was saved.":
     "No suggestion was generated. Check the selection, rubric and current submission revision.");
    return;
   }
   const raw:unknown=await response.json();
   const result=verifyFacultyAiGradingResult(raw,{
    assignmentId:selection.assignmentId,deliveryId:selection.deliveryId,
    submissionId:selection.submissionId,version:submission.version,
   },rubric,submission.textContent);
   setSuggestion(result.suggestion);
   setProviderStatus("Suggestion loaded for human review only. No grade was changed.");
  }catch{
   setProviderStatus("Could not verify a suggestion response. No grade was changed.");
  }finally{setRequesting(false);}
 }
 function downloadReviewReceipt(){
  if(!reviewed||!suggestion||!submission.eligible)return;
  const rubric=parseRubric();
  if(!rubric)return;
  try{
   const receipt=facultyAiGradingReviewReceipt({
    reviewedAt:new Date().toISOString(),assignmentId:selection.assignmentId,
    deliveryId:selection.deliveryId,submissionId:selection.submissionId,
    submissionVersion:submission.version,rubric,suggestion,reviewedEvidence,
    humanDraftPoints:Number(draftPoints),
   });
   const blob=new Blob([JSON.stringify(receipt,null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download="faculty-grading-review.json";
   document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
   setReceiptStatus("Local review receipt exported. It is not a server-side audit record or a published grade.");
  }catch{setReceiptStatus("Review receipt unavailable. Check all evidence and draft points.");}
 }
 function validateRubric(event:FormEvent<HTMLFormElement>){
  event.preventDefault();parseRubric();
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5" aria-label="AI grading review workspace">
  <h2 className="text-lg font-semibold text-foreground">Review submission: {submission.learnerLabel}</h2>
  <p className="text-sm text-body">Submission revision {submission.version} · Official maximum {maxPoints} points</p>
  {!submission.eligible?<p role="alert" className="rounded-md border border-border p-3 text-sm text-error">
   Suggestions are restricted to ungraded, unpublished text submissions with actual recorded text.
  </p>:null}
  {submission.textContent?<section className="space-y-2">
   <h3 className="font-semibold">Submitted text (authoritative evidence)</h3>
   <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface-subtle p-3 text-sm text-body">{submission.textContent}</pre>
  </section>:null}
  <form onSubmit={validateRubric} className="space-y-3">
   <label className="block text-sm font-semibold text-body">Human-authored rubric (JSON)
    <textarea value={rubricText} onChange={event=>onRubricChange(event.target.value)}
     rows={10} maxLength={12000} disabled={requesting}
     className="mt-2 w-full rounded-md border border-border bg-background p-3 font-mono text-sm"/>
   </label>
   <button type="submit" className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold">Validate rubric</button>
  </form>
  {rubricError?<p role="alert" className="text-sm text-error">{rubricError}</p>:null}
  <label className="flex items-start gap-2 text-sm text-body">
   <input type="checkbox" checked={permission} onChange={event=>setPermission(event.target.checked)}/>
   <span>I understand an approved provider, when enabled, would process the selected text and rubric. No learner contact details or files are intentionally sent.</span>
  </label>
  <button type="button" disabled={requesting||!submission.eligible||!permission}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
   onClick={()=>{void requestSuggestion();}}>
    Request suggestion (if provider enabled)
  </button>
  {providerStatus?<p role="status" className="text-sm text-body">{providerStatus}</p>:null}
  {requesting?<p role="status" className="text-sm text-body">Validating suggestion request…</p>:null}
  {suggestion?<div className="space-y-3 rounded-lg border border-border p-4">
   <h3 className="font-semibold">Untrusted suggestion · Review required</h3>
   <p className="text-sm text-body">Provider: {suggestion.provider} · confidence {suggestion.confidence}</p>
   <p className="text-sm text-body">{suggestion.feedback}</p>
   <p className="text-sm font-semibold text-body">Suggested {suggestion.proposedScore} / {maxPoints} points (not a grade)</p>
   <ol className="space-y-2">{suggestion.evidence.map(item=><li key={item.criterionId} className="rounded-md border border-border p-3 text-sm">
    <label className="flex items-start gap-2 font-semibold">
      <input type="checkbox" checked={reviewedEvidence.includes(item.criterionId)}
       onChange={()=>setReviewedEvidence(current=>toggleFacultyAiGradingReview(current,item.criterionId))}/>
      Reviewed {item.criterionId}: {item.earnedPoints} points suggested
    </label>
    <blockquote className="mt-1 border-l-2 border-border pl-3">{item.excerpt}</blockquote>
    <p className="mt-2 text-body">{item.reason}</p>
   </li>)}</ol>
   <p className="text-xs text-muted-foreground">Review every rubric finding against the submitted text before accepting a draft.</p>
   <button type="button" disabled={!facultyAiGradingEvidenceReviewed(suggestion.evidence,reviewedEvidence)}
    onClick={()=>{
      if(!window.confirm("Use this untrusted suggestion as an unsaved draft after reviewing every criterion? No grade will be saved or published."))return;
      setDraftPoints(String(suggestion.proposedScore));setDraftFeedback(suggestion.feedback);setReviewed(true);
    }} className="min-h-10 rounded-md border border-border px-4 text-sm disabled:opacity-50">Accept into local draft only</button>
  </div>:null}
  {reviewed?<section className="space-y-2 rounded-lg border border-border p-4">
   <h3 className="font-semibold">Human draft only</h3>
   <label className="block text-sm">Draft points
    <input type="number" min={0} max={maxPoints} value={draftPoints}
     onChange={event=>setDraftPoints(event.target.value)} className="mt-1 w-full rounded-md border border-border p-3"/>
   </label>
   <label className="block text-sm">Draft feedback
    <textarea value={draftFeedback} onChange={event=>setDraftFeedback(event.target.value)}
     maxLength={3000} rows={4} className="mt-1 w-full rounded-md border border-border p-3"/>
   </label>
   <p className="text-sm text-muted-foreground">This draft is not saved and is never published. Transfer reviewed details manually using the official grading controls.</p>
   <button type="button" onClick={downloadReviewReceipt}
    className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold">Export redacted review receipt</button>
   {receiptStatus?<p role="status" className="text-sm text-body">{receiptStatus}</p>:null}
  </section>:null}
  <Link href={facultyAiGradingReportHref(selection)} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
   Open official Faculty grading report
  </Link>
 </section>;
}
