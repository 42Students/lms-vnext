"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {aiGradingRubricForMaximum,type AiGradingSelection,type AiGradingRubric} from "@/modules/courses/faculty-ai-grading-model";
import {facultyAiGradingReportHref} from "@/modules/courses/faculty-ai-grading-links";
import type {AiGradingSuggestion} from "@/modules/courses/faculty-ai-grading-suggestion";

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
 const [suggestion,setSuggestion]=useState<AiGradingSuggestion|null>(null);
 const [reviewed,setReviewed]=useState(false);
 const [draftPoints,setDraftPoints]=useState("");
 const [draftFeedback,setDraftFeedback]=useState("");
 function parseRubric():AiGradingRubric|null{
  try{
   const result=aiGradingRubricForMaximum(JSON.parse(rubricText) as unknown,maxPoints);
   setRubricError(null);return result;
  }catch{setRubricError("Enter valid rubric JSON with unique criterion IDs and exactly "+maxPoints+" total points.");return null;}
 }
 function onRubricChange(value:string){
  setRubricText(value);setSuggestion(null);setReviewed(false);setRubricError(null);setProviderStatus(null);
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
   onClick={()=>{setProviderStatus("Provider disabled. No model call was made.");}}>
    Request suggestion (if provider enabled)
  </button>
  {providerStatus?<p role="status" className="text-sm text-body">{providerStatus}</p>:null}
  {requesting?<p role="status" className="text-sm text-body">Validating suggestion request…</p>:null}
  {suggestion?<div className="space-y-3 rounded-lg border border-border p-4">
   <h3 className="font-semibold">Untrusted suggestion · Review required</h3>
   <p className="text-sm text-body">Provider: {suggestion.provider} · confidence {suggestion.confidence}</p>
   <p className="text-sm text-body">{suggestion.feedback}</p>
   <p className="text-xs text-muted-foreground">Review every rubric finding against the submitted text before accepting a draft.</p>
   <button type="button" onClick={()=>setReviewed(true)} className="min-h-10 rounded-md border border-border px-4 text-sm">Mark evidence reviewed</button>
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
  </section>:null}
  <Link href={facultyAiGradingReportHref(selection)} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
   Open official Faculty grading report
  </Link>
 </section>;
}
