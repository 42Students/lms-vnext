"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {authoringLocalDateTime,authoringDueInstant}
 from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyAuthoringQuestionsFromResponse,facultyQuizDraftIssue,facultyChangeQuizChoiceType,facultyQuizDraftEditable,facultyQuizMetadataEditable,facultyToggleQuizAnswer,facultyRemoveQuizOption,facultyQuizConfirmationAfterEdit,facultyRemoveQuizQuestion,facultyAppendQuizQuestion,facultyQuizDraftLoadAllowsAction,facultyQuizMetadataIssue,facultyQuizWriteMessage,facultyQuizCanRetryDetails,facultyQuizCanPublishSavedDraft,facultyQuizSavedFromCommand,facultyQuizReconcileRows,facultyMoveQuizQuestion,facultyMoveQuizOption,facultyDuplicateQuizQuestion,facultyDuplicateQuizOption,facultyQuizSwitchNeedsConfirmation,facultyBeginQuizWrite,facultyQuizDraftReview,facultyQuizCanSaveChanges,facultyQuizMayResetDraft,facultyQuizCanCopyToDraft,facultyQuizCopyTitle,facultyQuizNormalizeQuestions,facultyQuizMatchesSearch,facultyQuizQuestionMatches,facultyQuizQuestionIssue,facultyQuizAnswerSummary,facultyInsertQuizQuestionAfter,facultyMoveQuizQuestionToEdge,facultyInsertQuizOptionAfter,facultyQuizOptionRemovalNeedsConfirmation,facultyQuizQuestionRemovalPrompt,facultyQuizApplyPastedOptions,facultyQuizLoadedBankIssue,facultyQuizRetryNeedsConfirmation,facultyQuizTitleConflict,facultyQuizReviewIssues,facultyQuizShouldDisplayQuestion,facultyQuizReadErrorMessage,facultyQuizOptionRemovalPrompt}
 from "@/modules/courses/faculty-quiz-builder-model";
type Option={text:string;correct:boolean;sequence:number};
type Question={type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;options:Option[]};
type Quiz={id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxAttempts:number;sequence:number;status:string;updatedAt:string;};
const fresh=():Question=>({
 type:"SINGLE_CHOICE",prompt:"",points:1,sequence:0,
 options:[{text:"",correct:true,sequence:0},{text:"",correct:false,sequence:1}],
});
export function FacultyChoiceQuizBuilder({deliveryId,lessons,quizzes}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];quizzes:readonly Quiz[];
}){
 const router=useRouter();
 const choiceRequest=useRef(0);
 const mutationInFlight=useRef(false);
 const [success,setSuccess]=useState<string|null>(null);
 const [selected,setSelected]=useState("");
 const [quizSearch,setQuizSearch]=useState("");
 const [questionSearch,setQuestionSearch]=useState("");
 const [invalidOnly,setInvalidOnly]=useState(false);
 const [localQuizzes,setLocalQuizzes]=useState<Quiz[]>([]);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxAttempts,setMaxAttempts]=useState(1);
 const [questions,setQuestions]=useState<Question[]>([fresh()]);
 const [confirmed,setConfirmed]=useState(false);
 const [dirtyDraft,setDirtyDraft]=useState(false);
 const [pending,setPending]=useState(false);
 const [detailsFailed,setDetailsFailed]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const review=facultyQuizDraftReview(questions);
 const reviewIssues=facultyQuizReviewIssues(questions);
 const matchingQuestions=questions.map((q,i)=>({q,i})).filter(({q,i})=>facultyQuizShouldDisplayQuestion(q,i,questionSearch,invalidOnly));
 const availableQuizzes=[...localQuizzes,...quizzes.filter(q=>!localQuizzes.some(local=>local.id===q.id))]
  .filter(q=>q.status!=="ARCHIVED");
 const chosen=availableQuizzes.find(q=>q.id===selected);
 const visibleQuizzes=availableQuizzes.filter(q=>q.id===selected||facultyQuizMatchesSearch(q,quizSearch));
 const editable=!pending && facultyQuizDraftEditable(chosen?.status);
 const metadataEditable=!pending && facultyQuizMetadataEditable(chosen?.status);
 async function choose(id:string){
  const token=++choiceRequest.current;
  setSelected(id);setConfirmed(false);setDirtyDraft(false);setError(null);setSuccess(null);setDetailsFailed(false);
  const q=availableQuizzes.find(x=>x.id===id);
  if(!q){setTitle("");setDescription("");setDueAt("");setMaxAttempts(1);
    setQuestions([fresh()]);setLessonId(lessons[0]?.id??"");setPending(false);return;}
  setTitle(q.title);setDescription(q.description??"");setDueAt(authoringLocalDateTime(q.dueAt));
  setMaxAttempts(q.maxAttempts);setLessonId(q.lessonId);setPending(true);
  try{
   const res=await fetch("/api/courses/quizzes/"+encodeURIComponent(q.id)+
     "?deliveryId="+encodeURIComponent(deliveryId),{cache:"no-store"});
   if(!res.ok)throw new Error("Cannot load quiz questions for this Section.");
   const response:unknown=await res.json();
   if(token!==choiceRequest.current)return;
   const fetched=facultyAuthoringQuestionsFromResponse(response);
   const loadIssue=facultyQuizLoadedBankIssue(q.status,fetched.length);
   if(loadIssue)throw new Error(loadIssue);
   setQuestions(fetched);
  }catch(e){if(token===choiceRequest.current){setError(facultyQuizReadErrorMessage(e));setQuestions([]);setDetailsFailed(true);}}
  finally{if(token===choiceRequest.current)setPending(false);}
 }
 function chooseWithDraftProtection(id:string){
  if(facultyQuizSwitchNeedsConfirmation(dirtyDraft,selected,id) &&
    !window.confirm("Discard unsaved Quiz edits and switch to another Quiz?"))return;
  void choose(id);
 }
 function resetDraft(){
  if(!facultyQuizMayResetDraft(dirtyDraft,pending))return;
  if(!window.confirm("Discard unsaved Quiz changes and restore the saved version?"))return;
  void choose(selected);
 }
 function copyToNewDraft(){
  if(!facultyQuizCanCopyToDraft(chosen?.status,questions.length>0,pending,detailsFailed))return;
  if(dirtyDraft && !window.confirm("Copy the current unsaved Quiz changes into a new draft?"))return;
  setSelected("");setTitle(facultyQuizCopyTitle(title));setConfirmed(false);
  setDirtyDraft(true);setError(null);
  setSuccess("Quiz copied to an unsaved draft. Review and select Create draft to save it.");
 }
 function updateQuestion(i:number,fn:(q:Question)=>Question){
  setQuestions(old=>old.map((q,n)=>n===i?fn(q):q));setConfirmed(false);setDirtyDraft(true);
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"CLOSE"|"ARCHIVE"){
  if(!confirmed){setError("Confirm the action before saving.");return;}
  if(pending)return;
  if(action==="EDIT" && !facultyQuizCanSaveChanges(chosen?.status,dirtyDraft,detailsFailed,pending)){
    setError("Nothing to save. Change a Quiz field before saving.");return;
  }
  if(action==="PUBLISH" && !facultyQuizCanPublishSavedDraft(chosen?.status,dirtyDraft,detailsFailed)){
    setError("Save the draft changes and reload the current Quiz before publishing.");return;
  }
  if(!facultyQuizDraftLoadAllowsAction(detailsFailed,chosen?.status,action)){
    setError("Reload the Quiz questions before editing or publishing this draft.");return;
  }
  if(action!=="CREATE" && (
    !chosen || ((action==="EDIT" && !facultyQuizMetadataEditable(chosen.status)) ||
     (action==="PUBLISH" && chosen.status!=="DRAFT")) ||
    (action==="CLOSE" && chosen.status!=="PUBLISHED") ||
    (action==="ARCHIVE" && !["DRAFT","PUBLISHED","CLOSED"].includes(chosen.status))
  )){
    setError("The selected quiz cannot perform this action. Refresh its current state.");return;
  }
  if(action==="CREATE"||(action==="EDIT"&&chosen?.status==="DRAFT")){
    const validation=facultyQuizDraftIssue(title,questions);
    if(validation){setError(validation);return;}
  }
  if(action==="CREATE"||action==="EDIT"){
    if(facultyQuizTitleConflict(availableQuizzes,title,chosen?.id)){
      setError("Another Quiz in this Section already uses this title.");return;
    }
    const issue=facultyQuizMetadataIssue(title,description,dueAt,maxAttempts);
    if(issue){setError(issue);return;}
  }
  const warning=action==="ARCHIVE" ?
    "Archive this Section Quiz? Learners will no longer see it. Quizzes with attempts cannot be archived." :
    action==="CLOSE" ?
    "Close this published Section Quiz? New learner attempts stop; existing attempts and grades remain." :
    "Confirm "+action.toLowerCase()+" for this Section Quiz?";
  if(!window.confirm(warning))return;
  if(!facultyBeginQuizWrite(mutationInFlight))return;
  setError(null);setSuccess(null);setPending(true);
  try{
   const body=(action==="PUBLISH"||action==="CLOSE"||action==="ARCHIVE")?{
     action,quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt,confirmed:true,
   }:{
     action,confirmed:true,
     ...(action==="CREATE"?{lessonId,
       sequence:Math.max(0,...availableQuizzes.filter(x=>x.lessonId===lessonId).map(x=>x.sequence+1))}
       :{quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt}),
     title,description:description||null,dueAt:authoringDueInstant(dueAt),
     maxAttempts,
     ...(action==="CREATE" || chosen?.status==="DRAFT" ? {questions:facultyQuizNormalizeQuestions(questions)} : {}),
   };
   const res=await fetch("/api/courses/faculty/quizzes/"+encodeURIComponent(deliveryId)+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   if(!res.ok){
     const failure:unknown=await res.json().catch(()=>null);
     throw new Error(facultyQuizWriteMessage(failure));
   }
   const result:unknown=await res.json().catch(()=>null);
   const saved=facultyQuizSavedFromCommand(result);
   if(!saved){router.refresh();throw new Error("Quiz write succeeded, but its new version could not be loaded. Refresh before another action.");}
   setLocalQuizzes(previous=>facultyQuizReconcileRows(previous,saved));
   if(action==="CREATE")setSelected(saved.id);
   setConfirmed(false);setDirtyDraft(false);setSuccess("Quiz "+action.toLowerCase()+" completed.");
   if(action==="ARCHIVE"){
     ++choiceRequest.current;
     setSelected("");setTitle("");setDescription("");setDueAt("");
     setMaxAttempts(1);setQuestions([fresh()]);setLessonId(lessons[0]?.id??"");
   }
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}
  finally{mutationInFlight.current=false;setPending(false);}
 }
 return <section className="min-w-0 w-full max-w-full space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Choice-question quiz builder</h2>
  <label className="grid min-w-0 gap-1 text-sm">Find a quiz
   <input type="search" value={quizSearch} onChange={e=>setQuizSearch(e.target.value)}
    placeholder="Title or state" className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/>
  </label>
  <label className="grid min-w-0 gap-1 text-sm">Quiz
   <select value={selected} disabled={pending} onChange={e=>chooseWithDraftProtection(e.target.value)}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2">
    <option value="">Create new draft</option>
    {visibleQuizzes.map(q=><option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
   </select></label>
  {quizSearch.trim()&&visibleQuizzes.length===0?<p role="status" className="text-sm text-body">No matching quizzes. Clear the search to see all Section quizzes.</p>:null}
  {chosen?<p className="text-xs text-body">State: {chosen.status}; published quizzes and attempted quizzes cannot change their questions.</p>:null}
  {facultyQuizCanCopyToDraft(chosen?.status,questions.length>0,pending,detailsFailed)?
   <button type="button" onClick={copyToNewDraft} className="rounded border border-border px-3 py-2 text-sm font-semibold">Copy as new draft</button>:null}
  {!chosen?<label className="grid min-w-0 gap-1 text-sm">Lesson
   <select value={lessonId} onChange={e=>{setConfirmed(false);setDirtyDraft(true);setLessonId(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2">
    {lessons.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
   </select></label>:null}
  <label className="grid min-w-0 gap-1 text-sm">Quiz title
   <input value={title} disabled={!metadataEditable} maxLength={255} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,title,e.target.value));setDirtyDraft(true);setTitle(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Instructions
   <textarea value={description} disabled={!metadataEditable} maxLength={10000} rows={2}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,description,e.target.value));setDirtyDraft(true);setDescription(e.target.value);}}
    className="min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Due date (IST, optional)
   <input type="datetime-local" disabled={!metadataEditable} value={dueAt} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,dueAt,e.target.value));setDirtyDraft(true);setDueAt(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Maximum attempts
   <input type="number" disabled={!editable} min={1} max={20} value={maxAttempts}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,maxAttempts,Number(e.target.value)));setDirtyDraft(true);setMaxAttempts(Number(e.target.value));}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Find a question
   <input type="search" value={questionSearch} onChange={e=>setQuestionSearch(e.target.value)}
    placeholder="Question number, prompt, or option" className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/>
  </label>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={invalidOnly}
    onChange={e=>setInvalidOnly(e.target.checked)}/>Show only questions needing correction</label>
  {matchingQuestions.length===0?<p role="status" className="text-sm text-body">No questions match these review filters. Clear the search or invalid-only filter to view the entire bank.</p>:null}
  {matchingQuestions.map(({q,i})=><fieldset key={i} disabled={!editable}
   className="min-w-0 max-w-full space-y-3 rounded-lg border border-border p-4">
   <legend className="text-sm font-semibold">Question {i+1}</legend>
   {facultyQuizQuestionIssue(q)?<p role="status" className="text-xs text-error">Review question {i+1}: {facultyQuizQuestionIssue(q)}</p>:
    <p className="text-xs text-body">Question {i+1} is ready to save.</p>}
   <label className="grid min-w-0 gap-1 text-sm">Prompt
    <textarea value={q.prompt} maxLength={5000} rows={2}
     onChange={e=>updateQuestion(i,old=>({...old,prompt:e.target.value}))}
     className="min-w-0 max-w-full rounded border border-border p-2"/></label>
   <div className="flex flex-wrap gap-3">
    <label className="grid min-w-0 gap-1 text-sm">Type
     <select value={q.type}
      onChange={e=>updateQuestion(i,old=>({...old,...facultyChangeQuizChoiceType(old,e.target.value as Question["type"])}))}
      className="min-h-10 min-w-0 max-w-full rounded border border-border p-2">
      <option value="SINGLE_CHOICE">Single choice</option>
      <option value="MULTIPLE_CHOICE">Multiple choice</option>
     </select></label>
    <label className="grid min-w-0 gap-1 text-sm">Points
     <input type="number" min={1} max={1000} value={q.points}
      onChange={e=>updateQuestion(i,old=>({...old,points:Number(e.target.value)}))}
      className="min-h-10 w-24 rounded border border-border p-2"/></label>
   </div>
   <p className="text-xs text-body" role="status">{facultyQuizAnswerSummary(q)}</p>
   {q.options.map((o,j)=><div key={j} className="flex flex-wrap items-center gap-2">
    <label className="min-w-0 flex-[1_1_12rem] text-sm">Option {j+1}
     <input value={o.text} maxLength={2000}
      onChange={e=>updateQuestion(i,old=>({...old,options:old.options.map((x,k)=>k===j?{...x,text:e.target.value}:x)}))}
      className="mt-1 block min-h-10 min-w-0 w-full max-w-full rounded border border-border p-2"/></label>
    <label className="flex items-center gap-1 text-xs">
     <input type="checkbox" checked={o.correct}
      onChange={e=>updateQuestion(i,old=>({...old,options:facultyToggleQuizAnswer(old,j,e.target.checked)}))}/>
     Correct
    </label>
    <button type="button" disabled={j===0} onClick={()=>updateQuestion(i,old=>({...old,options:facultyMoveQuizOption(old.options,j,j-1)}))}
     aria-label={"Move answer "+(j+1)+" up in question "+(i+1)} className="rounded border border-border px-2 py-1 text-xs">↑</button>
    <button type="button" disabled={j===q.options.length-1} onClick={()=>updateQuestion(i,old=>({...old,options:facultyMoveQuizOption(old.options,j,j+1)}))}
     aria-label={"Move answer "+(j+1)+" down in question "+(i+1)} className="rounded border border-border px-2 py-1 text-xs">↓</button>
    <button type="button" disabled={q.options.length>=20}
     onClick={()=>updateQuestion(i,old=>({...old,options:facultyInsertQuizOptionAfter(old.options,j,{text:"",correct:false,sequence:j+1})}))}
     aria-label={"Insert answer after "+(j+1)+" in question "+(i+1)} className="rounded border border-border px-2 py-1 text-xs">Insert below</button>
    <button type="button" disabled={q.options.length>=20}
     onClick={()=>updateQuestion(i,old=>({...old,options:facultyDuplicateQuizOption(old.options,j)}))}
     aria-label={"Duplicate answer "+(j+1)+" in question "+(i+1)} className="rounded border border-border px-2 py-1 text-xs">Duplicate</button>
    <button type="button" disabled={q.options.length<=2}
     onClick={()=>{if(facultyQuizOptionRemovalNeedsConfirmation(q.options,j) &&
      !window.confirm(facultyQuizOptionRemovalPrompt(q.type,q.options,i,j)))return;
      updateQuestion(i,old=>({...old,options:facultyRemoveQuizOption(old,j)}));}}
     className="rounded border border-border px-2 py-1 text-xs">Remove</button>
   </div>)}
   <button type="button" disabled={q.options.length>=20}
    onClick={()=>{const pasted=window.prompt("Paste up to 20 answer choices separated by a new line or |. Empty draft choices will be replaced.");
     if(pasted===null)return;
     const result=facultyQuizApplyPastedOptions(q.options,pasted);
     if(!result.ok){setError(result.issue);return;}
     updateQuestion(i,old=>({...old,options:result.options}));setError(null);}}
    className="rounded border border-border px-3 py-2 text-sm">Paste choices</button>
   <button type="button" disabled={q.options.length>=20}
    onClick={()=>updateQuestion(i,old=>({...old,options:[...old.options,{text:"",correct:false,sequence:old.options.length}]}))}
    className="rounded border border-border px-3 py-2 text-sm">Add option</button>
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={i===0} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestionToEdge(old,i,"FIRST"));}}
     className="rounded border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" to first"}>First</button>
    <button type="button" disabled={i===0} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestion(old,i,i-1));}}
     className="rounded border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" up"}>Move up</button>
    <button type="button" disabled={i===questions.length-1} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestion(old,i,i+1));}}
     className="rounded border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" down"}>Move down</button>
    <button type="button" disabled={i===questions.length-1} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestionToEdge(old,i,"LAST"));}}
     className="rounded border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" to last"}>Last</button>
   </div>
   <button type="button" disabled={questions.length>=100}
    onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyInsertQuizQuestionAfter(old,i,{...fresh(),sequence:i+1}));}}
    className="rounded border border-border px-3 py-2 text-sm" aria-label={"Insert question after "+(i+1)}>Insert below</button>
   <button type="button" disabled={questions.length>=100}
    onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyDuplicateQuizQuestion(old,i));}}
    className="rounded border border-border px-3 py-2 text-sm" aria-label={"Duplicate question "+(i+1)}>Duplicate question</button>
   <button type="button" disabled={questions.length<=1}
    onClick={()=>{if(!window.confirm(facultyQuizQuestionRemovalPrompt(i,q.prompt)))return;
     setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyRemoveQuizQuestion(old,i));}}
    className="ml-2 rounded border border-border px-3 py-2 text-sm">Remove question</button>
  </fieldset>)}
  <button type="button" disabled={!editable||questions.length>=100}
   onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyAppendQuizQuestion(old,{...fresh(),sequence:old.length}));}}
   className="rounded border border-border px-4 py-2 text-sm">Add question</button>
  <div role="status" aria-live="polite" className="space-y-1 rounded-lg border border-border bg-background p-3 text-sm">
   <p className="font-semibold">Draft review: {review.questionCount} questions · {review.optionCount} options · {review.totalPoints} total points</p>
   <p>{review.missingCorrect===0?"Every question has a correct answer selected.":review.missingCorrect+" question(s) need a correct answer."}</p>
   <p>{reviewIssues.invalidQuestions===0?"All question formats pass validation.":reviewIssues.invalidQuestions+" question(s) need editing before save."}</p>
   {reviewIssues.overLimit?<p role="alert" className="text-error">Total points exceed the 10,000-point limit.</p>:null}
   <p className="text-xs text-muted-foreground">Review these draft values before saving or publishing.</p>
  </div>
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed}
   onChange={e=>setConfirmed(e.target.checked)}/>
   I confirm these choices, point totals and the current draft state.
  </label>
  {chosen?.status==="DRAFT"&&dirtyDraft?
    <p role="status" className="text-sm text-body">You have unsaved changes. Save the draft before publishing.</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {facultyQuizCanRetryDetails(detailsFailed,chosen?.id,pending) ?
    <button type="button" onClick={()=>{if(facultyQuizRetryNeedsConfirmation(dirtyDraft,pending)&&
      !window.confirm("Discard unsaved Quiz metadata and retry loading the saved question bank?"))return;
      void choose(selected);}}
      className="inline-flex min-h-10 items-center rounded border border-border px-3 py-2 text-sm font-semibold text-primary-text">
      Reload Quiz questions
    </button> : null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <div className="flex flex-wrap gap-3">
   {facultyQuizMayResetDraft(dirtyDraft,pending)?<button type="button" onClick={resetDraft}
    className="rounded border border-border px-4 py-2 text-sm">Discard unsaved edits</button>:null}
   {!chosen?<button type="button" disabled={!confirmed||pending||!lessonId}
    onClick={()=>void submit("CREATE")} className="rounded bg-primary px-4 py-2 text-on-primary">Create draft</button>:
    <>
    <button type="button" disabled={!confirmed||!facultyQuizCanSaveChanges(chosen.status,dirtyDraft,detailsFailed,pending)}
     onClick={()=>void submit("EDIT")} className="rounded border border-border px-4 py-2">{chosen.status==="DRAFT"?"Save draft":"Save metadata"}</button>
    <button type="button" disabled={!confirmed||pending||!facultyQuizCanPublishSavedDraft(chosen.status,dirtyDraft,detailsFailed)}
     onClick={()=>void submit("PUBLISH")} className="rounded bg-primary px-4 py-2 text-on-primary">Publish</button>
    {chosen.status==="PUBLISHED"&&
     <button type="button" disabled={!confirmed||pending}
      onClick={()=>void submit("CLOSE")}
      className="rounded border border-border px-4 py-2">
      Close quiz
     </button>}
    {["DRAFT","PUBLISHED","CLOSED"].includes(chosen.status)&&
     <button type="button" disabled={!confirmed||pending}
      onClick={()=>void submit("ARCHIVE")}
      className="rounded border border-error px-4 py-2 text-error">
      Archive quiz
     </button>}
    </>}
  </div>
  <p className="text-xs text-muted-foreground">
   Each question needs unique nonblank options and valid correct answers; total points must not exceed 10000. Edits are blocked after publication or first attempt. Closing stops future attempts while keeping submitted results. Archiving hides the quiz from learner lists without deleting history and is refused after any attempt.
  </p>
 </section>;
}
