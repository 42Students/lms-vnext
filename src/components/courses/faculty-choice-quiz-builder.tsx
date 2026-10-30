"use client";
import { Radio } from "@/components/ui/radio";
import { Checkbox as NativeCheckbox } from "@/components/ui/checkbox";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/selection-controls";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {authoringLocalDateTime,authoringDueInstant}
 from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyAuthoringQuestionsFromResponse,facultyQuizShuffleSettingsFromResponse,facultyQuizDraftIssue,facultyChangeQuizChoiceType,facultyQuizDraftEditable,facultyQuizMetadataEditable,facultyToggleQuizAnswer,facultyRemoveQuizOption,facultyQuizConfirmationAfterEdit,facultyRemoveQuizQuestion,facultyAppendQuizQuestion,facultyQuizDraftLoadAllowsAction,facultyQuizMetadataIssue,facultyQuizCanRetryDetails,facultyQuizSavedFromCommand,facultyQuizReconcileRows,facultyMoveQuizQuestion,facultyMoveQuizOption,facultyDuplicateQuizQuestion,facultyDuplicateQuizOption,facultyQuizSwitchNeedsConfirmation,facultyBeginQuizWrite,facultyQuizDraftReview,facultyQuizCanSaveChanges,facultyQuizMayResetDraft,facultyQuizCanCopyToDraft,facultyQuizCopyTitle,facultyQuizNormalizeQuestions,facultyQuizMatchesSearch,facultyQuizQuestionIssue,facultyQuizAnswerSummary,facultyInsertQuizQuestionAfter,facultyMoveQuizQuestionToEdge,facultyInsertQuizOptionAfter,facultyQuizOptionRemovalNeedsConfirmation,facultyQuizQuestionRemovalPrompt,facultyQuizApplyPastedOptions,facultyQuizLoadedBankIssue,facultyQuizRetryNeedsConfirmation,facultyQuizTitleConflict,facultyQuizReviewIssues,facultyQuizShouldDisplayQuestion,facultyQuizReadErrorMessage,facultyQuizOptionRemovalPrompt,facultyQuizReadyToPublish}
 from "@/modules/courses/faculty-quiz-builder-model";
type Option={id?:string;clientKey?:string;text:string;correct:boolean;sequence:number};
let nextDraftOptionKey=0;
const draftOptionKey=()=>`draft-option-${++nextDraftOptionKey}`;
type Question={type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;options:Option[]};
type Quiz={id:string;lessonId:string;title:string;description:string|null;dueAt:string|null;
 maxAttempts:number;sequence:number;status:string;updatedAt:string;
 shuffleQuestions?:boolean;shuffleOptions?:boolean;};
const fresh=():Question=>({
 type:"SINGLE_CHOICE",prompt:"",points:1,sequence:0,
 options:[{text:"",correct:true,sequence:0},{text:"",correct:false,sequence:1}],
});
export function FacultyChoiceQuizBuilder({deliveryId,lessons,quizzes,initialLessonId=null}:{
 deliveryId:string;lessons:readonly {id:string;name:string}[];quizzes:readonly Quiz[];initialLessonId?:string|null;
}){
 const router=useRouter();
 const choiceRequest=useRef(0);
 const mutationInFlight=useRef(false);
 const [success,setSuccess]=useState<string|null>(null);
 const [selected,setSelected]=useState("");
 const [quizSearch,setQuizSearch]=useState("");
 const [questionSearch,setQuestionSearch]=useState("");
 const [pasteQuestionIndex,setPasteQuestionIndex]=useState<number|null>(null);
 const [pastedChoices,setPastedChoices]=useState("");
 const [invalidOnly,setInvalidOnly]=useState(false);
 const [previewOpen,setPreviewOpen]=useState(false);
 const [previewAnswers,setPreviewAnswers]=useState(false);
 const [localQuizzes,setLocalQuizzes]=useState<Quiz[]>([]);
 const defaultLessonId=lessons.find(lesson=>lesson.id===initialLessonId)?.id??lessons[0]?.id??"";
 const [lessonId,setLessonId]=useState(defaultLessonId);
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxAttempts,setMaxAttempts]=useState(1);
 const [shuffleQuestions,setShuffleQuestions]=useState(false);
 const [shuffleOptions,setShuffleOptions]=useState(false);
 const [questions,setQuestions]=useState<Question[]>([fresh()]);
 const [confirmed,setConfirmed]=useState(false);
 const [dirtyDraft,setDirtyDraft]=useState(false);
 const [pending,setPending]=useState(false);
 const confirmTask=useRef<(()=>void)|null>(null);
 const [confirmRequest,setConfirmRequest]=useState<{title:string;variant:"danger"|"primary"}|null>(null);
 function askConfirm(title:string,task:()=>void,variant:"danger"|"primary"="danger"){
  confirmTask.current=task;setConfirmRequest({title,variant});
 }
 function dismissConfirm(){confirmTask.current=null;setConfirmRequest(null);}
 function acceptConfirm(){const task=confirmTask.current;dismissConfirm();task?.();}
 const [publishNow,setPublishNow]=useState(true);
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
  if(!q){setTitle("");setDescription("");setDueAt("");setMaxAttempts(1);setShuffleQuestions(false);setShuffleOptions(false);
    setQuestions([fresh()]);setLessonId(defaultLessonId);setPending(false);return;}
  setTitle(q.title);setDescription(q.description??"");setDueAt(authoringLocalDateTime(q.dueAt));
  setMaxAttempts(q.maxAttempts);setShuffleQuestions(Boolean(q.shuffleQuestions));setShuffleOptions(Boolean(q.shuffleOptions));setLessonId(q.lessonId);setPending(true);
  try{
   const response=await apiFetch<unknown>("/api/courses/quizzes/"+encodeURIComponent(q.id)+
     "?deliveryId="+encodeURIComponent(deliveryId)+"&includeCorrectAnswers=true",{cache:"no-store"});
   if(token!==choiceRequest.current)return;
   // The read route omits private answer flags unless the caller opts in.
   // This authenticated Faculty editor must load those flags or every saved
   // SINGLE_CHOICE answer becomes false and draft edits fail validation.
   // Learner requests remain restricted by getCourseQuiz's release policy.
   const fetched=facultyAuthoringQuestionsFromResponse(response);
   const settings=facultyQuizShuffleSettingsFromResponse(response);
   const loadIssue=facultyQuizLoadedBankIssue(q.status,fetched.length);
   if(loadIssue)throw new Error(loadIssue);
   // The saved persisted flags are authoritative. A stale Section list must
   // never silently clear shuffle when Faculty edits an existing Quiz.
   setShuffleQuestions(settings.shuffleQuestions);
   setShuffleOptions(settings.shuffleOptions);
   setQuestions(fetched.map(question=>({...question,options:question.options.map(option=>({...(option.id!==undefined?{id:option.id}:{}),text:option.text,correct:option.correct,sequence:option.sequence}))})));
  }catch(e){if(token===choiceRequest.current){setError(facultyQuizReadErrorMessage(e));setQuestions([]);setDetailsFailed(true);}}
  finally{if(token===choiceRequest.current)setPending(false);}
 }
 function chooseWithDraftProtection(id:string){
  if(facultyQuizSwitchNeedsConfirmation(dirtyDraft,selected,id)){
   askConfirm("Discard unsaved Quiz edits and switch to another Quiz?",()=>void choose(id));return;
  }
  void choose(id);
 }
 function resetDraft(){
  if(!facultyQuizMayResetDraft(dirtyDraft,pending))return;
  askConfirm("Discard unsaved Quiz changes and restore the saved version?",()=>void choose(selected));
 }
 function copyToNewDraft(confirmed=false){
  if(!facultyQuizCanCopyToDraft(chosen?.status,questions.length>0,pending,detailsFailed))return;
  if(dirtyDraft && !confirmed){askConfirm("Copy the current unsaved Quiz changes into a new draft?",()=>copyToNewDraft(true),"primary");return;}
  setSelected("");setTitle(facultyQuizCopyTitle(title));setConfirmed(false);
  setDirtyDraft(true);setError(null);
  setSuccess("Quiz copied to an unsaved draft. Review and select Create draft to save it.");
 }
 function updateQuestion(i:number,fn:(q:Question)=>Question){
  setQuestions(old=>old.map((q,n)=>n===i?fn(q):q));setConfirmed(false);setDirtyDraft(true);
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"CLOSE"|"ARCHIVE",confirmed=false){
  // Routine quiz save relies on the command response and server validation; only destructive actions prompt.
  if(pending)return;
  if(action==="EDIT" && !facultyQuizCanSaveChanges(chosen?.status,dirtyDraft,detailsFailed,pending)){
    setError("Nothing to save. Change a Quiz field before saving.");return;
  }
  if(action==="PUBLISH" && !facultyQuizReadyToPublish(chosen?.status,dirtyDraft,detailsFailed,questions)){
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
  if(action==="CREATE" && publishNow){
    const due=authoringDueInstant(dueAt);
    if(!due || !Number.isFinite(Date.parse(due)) || Date.parse(due)<=new Date().getTime()){
      setError("Pick a due date and time in the future");return;
    }
  }
  const warning=action==="ARCHIVE" ?
    "Archive this Section Quiz? Learners will no longer see it. Quizzes with attempts cannot be archived." :
    action==="CLOSE" ?
    "Close this published Section Quiz? New learner attempts stop; existing attempts and grades remain." :
    "Confirm "+action.toLowerCase()+" for this Section Quiz?";
  if((action==="ARCHIVE"||action==="CLOSE")&&!confirmed){askConfirm(warning,()=>void submit(action,true));return;}
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
     maxAttempts,shuffleQuestions,shuffleOptions,
     ...(action==="CREATE" || chosen?.status==="DRAFT" ? {questions:facultyQuizNormalizeQuestions(questions).map(question=>({...question,options:question.options.map(({text,correct,sequence})=>({text,correct,sequence}))}))} : {}),
   };
   const endpoint="/api/courses/faculty/quizzes/"+encodeURIComponent(deliveryId)+"/command";
   const result=await apiFetch<unknown>(endpoint,{
     method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   const saved=facultyQuizSavedFromCommand(result);
   if(!saved){router.refresh();throw new Error("Quiz write succeeded, but its new version could not be loaded. Refresh before another action.");}
   const {shuffleQuestions:savedShuffleQuestions,shuffleOptions:savedShuffleOptions,...savedBase}=saved;
   const savedQuiz:Quiz={...savedBase,...(savedShuffleQuestions!==undefined?{shuffleQuestions:savedShuffleQuestions}:{}),...(savedShuffleOptions!==undefined?{shuffleOptions:savedShuffleOptions}:{})};
   setLocalQuizzes(previous=>facultyQuizReconcileRows(previous,savedQuiz));
   if(action==="CREATE")setSelected(saved.id);
   setConfirmed(false);setDirtyDraft(false);
   if(action==="CREATE" && publishNow){
     try{
       const published=facultyQuizSavedFromCommand(await apiFetch<unknown>(endpoint,{
         method:"POST",headers:{"Content-Type":"application/json"},
         body:JSON.stringify({action:"PUBLISH",quizId:saved.id,
           expectedUpdatedAt:saved.updatedAt,confirmed:true}),
       }));
       if(!published||published.status!=="PUBLISHED")throw new Error("The quiz was saved, but publishing could not be confirmed.");
       const {shuffleQuestions:publishedShuffleQuestions,shuffleOptions:publishedShuffleOptions,...publishedBase}=published;
       const publishedQuiz:Quiz={...publishedBase,...(publishedShuffleQuestions!==undefined?{shuffleQuestions:publishedShuffleQuestions}:{}),...(publishedShuffleOptions!==undefined?{shuffleOptions:publishedShuffleOptions}:{})};
       setLocalQuizzes(previous=>facultyQuizReconcileRows(previous,publishedQuiz));
       setSuccess("Quiz created and published. Learners can attempt it until the due date.");
     }catch(reason){
       setSuccess("Quiz created as a draft. Publish it when it is ready for learners.");
       setError(reason instanceof Error?reason.message:friendlyApiError({}));
     }
   }else if(action==="CREATE"){
     setSuccess("Quiz created as a draft. Publish it when it is ready for learners.");
   }else setSuccess("Quiz "+action.toLowerCase()+" completed.");
   if(action==="ARCHIVE"){
     ++choiceRequest.current;
     setSelected("");setTitle("");setDescription("");setDueAt("");
     setMaxAttempts(1);setShuffleQuestions(false);setShuffleOptions(false);setQuestions([fresh()]);setLessonId(defaultLessonId);
   }
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}
  finally{mutationInFlight.current=false;setPending(false);}
 }
 return <section className="min-w-0 w-full max-w-full space-y-4 max-[767px]:[&_button]:min-h-11">
  <h2 className="text-base font-semibold text-[var(--lms-heading)]">Choice-question quiz builder</h2>
  <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find a quiz
   <Input type="search" value={quizSearch} onChange={e=>setQuizSearch(e.target.value)}
    placeholder="Title or state" className="min-h-11 min-w-0 max-w-full md:min-h-9"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Quiz
   <Select value={selected} disabled={pending} onChange={e=>chooseWithDraftProtection(e.target.value)}
    className="min-h-11 min-w-0 max-w-full md:min-h-9">
    <option value="">Create new draft</option>
    {visibleQuizzes.map(q=><option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
   </Select></label>
  </div>
  {quizSearch.trim()&&visibleQuizzes.length===0?<EmptyState title="No matching quizzes" description="Clear the search to see all Section quizzes."/>:null}
  {chosen?<p className="text-xs text-body">State: {chosen.status}; published quizzes and attempted quizzes cannot change their questions.</p>:null}
  {facultyQuizCanCopyToDraft(chosen?.status,questions.length>0,pending,detailsFailed)?
   <Button variant="secondary" type="button" onClick={()=>copyToNewDraft()} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-[650]">Copy as new draft</Button>:null}
  {!chosen?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
   <Select value={lessonId} onChange={e=>{setConfirmed(false);setDirtyDraft(true);setLessonId(e.target.value);}}
    className="min-h-11 min-w-0 max-w-full md:min-h-9">
    {lessons.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
   </Select></label>:null}
  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Quiz title
   <Input value={title} disabled={!metadataEditable} maxLength={255} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,title,e.target.value));setDirtyDraft(true);setTitle(e.target.value);}}
    className="min-h-11 min-w-0 max-w-full md:min-h-9"/></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 md:col-span-2 text-[var(--lms-neutral-400)]">Instructions
   <Textarea value={description} disabled={!metadataEditable} maxLength={10000} rows={2}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,description,e.target.value));setDirtyDraft(true);setDescription(e.target.value);}}
    className="min-w-0 max-w-full"/></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Due date (IST, required before publishing)
   <Input type="datetime-local" disabled={!metadataEditable} value={dueAt} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,dueAt,e.target.value));setDirtyDraft(true);setDueAt(e.target.value);}}
    className="min-h-11 min-w-0 max-w-full md:min-h-9"/></label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum attempts
   <Input type="number" disabled={!editable} min={1} max={20} value={maxAttempts}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,maxAttempts,Number(e.target.value)));setDirtyDraft(true);setMaxAttempts(Number(e.target.value));}}
    className="min-h-11 min-w-0 max-w-full md:min-h-9"/></label>
  </div>
  <fieldset disabled={!editable} className="space-y-2 border-y border-border py-3">
    <legend className="text-sm font-semibold">Quiz order</legend>
    <Checkbox label="Shuffle question order per learner" checked={shuffleQuestions}
         onChange={e=>{setConfirmed(false);setDirtyDraft(true);setShuffleQuestions(e.target.checked);}}/>
    <Checkbox label="Shuffle answer options per learner" checked={shuffleOptions}
         onChange={e=>{setConfirmed(false);setDirtyDraft(true);setShuffleOptions(e.target.checked);}}/>
  </fieldset>
  <section aria-label="Quiz preview" className="min-w-0 border-b border-border pb-4">
   <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
     <h3 className="text-sm font-semibold text-foreground">Preview Quiz</h3>
     <p className="text-xs text-muted-foreground">Read-only learner-style preview of the current questions. No answers are submitted.</p>
    </div>
    <Button variant="secondary" type="button" onClick={()=>setPreviewOpen(open=>!open)}
     aria-expanded={previewOpen} aria-controls="faculty-quiz-preview"
     className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650]">
     {previewOpen?"Hide preview":"Preview Quiz"}
    </Button>
   </div>
   {previewOpen?<div id="faculty-quiz-preview" className="mt-3 space-y-4">
    <Checkbox label="Show answer key to faculty" checked={previewAnswers}
       onChange={e=>setPreviewAnswers(e.target.checked)}/>
    {!questions.length?<EmptyState title="No questions yet." />:null}
    {questions.map((question,index)=><fieldset key={index}
     className="min-w-0 space-y-2 border-b border-border py-3">
     <legend className="text-sm font-semibold">Question {index+1} · {question.points} point(s)</legend>
     <p className="whitespace-pre-wrap break-words text-sm text-body">{question.prompt||"Question prompt not entered"}</p>
     {question.options.map((option,i)=><label key={option.id??option.clientKey??i}
      className="flex items-start gap-2 text-sm text-body">
      {question.type === "SINGLE_CHOICE" ? <Radio 
       name={"preview-question-"+index} disabled/> : <NativeCheckbox 
       name={"preview-question-"+index} disabled/>}
      <span>{option.text||"Option not entered"}</span>
      {previewAnswers&&option.correct?<span className="text-xs font-semibold text-success">(Correct)</span>:null}
     </label>)}
    </fieldset>)}
   </div>:null}
  </section>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find a question
   <Input type="search" value={questionSearch} onChange={e=>setQuestionSearch(e.target.value)}
    placeholder="Question number, prompt, or option" className="min-h-11 min-w-0 max-w-full md:min-h-9"/>
  </label>
  <Checkbox label="Show only questions needing correction" checked={invalidOnly}
     onChange={e=>setInvalidOnly(e.target.checked)}/>
  {matchingQuestions.length===0?<EmptyState title="No questions match these review filters" description="Clear the search or invalid-only filter to view the entire bank."/>:null}
  {matchingQuestions.map(({q,i})=><fieldset key={i} disabled={!editable}
   className="min-w-0 max-w-full space-y-3 border-b border-border py-4">
   <legend className="text-sm font-semibold">Question {i+1}</legend>
   {facultyQuizQuestionIssue(q)?<p role="status" className="text-xs text-error">Review question {i+1}: {facultyQuizQuestionIssue(q)}</p>:
    <p className="text-xs text-body">Question {i+1} is ready to save.</p>}
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Prompt
    <Textarea value={q.prompt} maxLength={5000} rows={2}
     onChange={e=>updateQuestion(i,old=>({...old,prompt:e.target.value}))}
     className="min-w-0 max-w-full"/></label>
   <div className="grid min-w-0 grid-cols-2 gap-3">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
     <Select value={q.type}
      onChange={e=>updateQuestion(i,old=>({...old,...facultyChangeQuizChoiceType(old,e.target.value as Question["type"])}))}
      className="min-h-11 min-w-0 max-w-full md:min-h-9">
      <option value="SINGLE_CHOICE">Single choice</option>
      <option value="MULTIPLE_CHOICE">Multiple choice</option>
     </Select></label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Points
     <Input type="number" min={1} max={100} value={q.points}
      onChange={e=>updateQuestion(i,old=>({...old,points:Number(e.target.value)}))}
      className="min-h-11 md:min-h-9 w-24 rounded-[var(--lms-control-radius)] border border-border p-2 text-base md:text-sm"/></label>
   </div>
   <p className="text-xs text-body" role="status">{facultyQuizAnswerSummary(q)}</p>
   {q.options.map((o,j)=><div key={o.id??o.clientKey??j} className="grid min-w-0 grid-cols-2 items-end gap-2 border-b border-border pb-3 sm:flex sm:flex-wrap sm:items-center">
    <label className="col-span-2 min-w-0 text-[13px] font-semibold leading-4 sm:flex-[1_1_12rem] text-[var(--lms-neutral-400)]">Option {j+1}
     <Input value={o.text} maxLength={2000}
      onChange={e=>updateQuestion(i,old=>({...old,options:old.options.map((x,k)=>k===j?{...x,text:e.target.value}:x)}))}
      className="mt-1 block min-h-11 md:min-h-9 min-w-0 w-full max-w-full rounded-[var(--lms-control-radius)] border border-border p-2 text-base md:text-sm"/></label>
    <Checkbox label="Correct" checked={o.correct}
       onChange={e=>updateQuestion(i,old=>({...old,options:facultyToggleQuizAnswer(old,j,e.target.checked)}))}/>
    <Button variant="secondary" type="button" disabled={j===0} onClick={()=>updateQuestion(i,old=>({...old,options:facultyMoveQuizOption(old.options,j,j-1)}))}
     aria-label={"Move answer "+(j+1)+" up in question "+(i+1)} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">↑</Button>
    <Button variant="secondary" type="button" disabled={j===q.options.length-1} onClick={()=>updateQuestion(i,old=>({...old,options:facultyMoveQuizOption(old.options,j,j+1)}))}
     aria-label={"Move answer "+(j+1)+" down in question "+(i+1)} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">↓</Button>
    <Button variant="secondary" type="button" disabled={q.options.length>=20}
     onClick={()=>updateQuestion(i,old=>({...old,options:facultyInsertQuizOptionAfter(old.options,j,{clientKey:draftOptionKey(),text:"",correct:false,sequence:j+1})}))}
     aria-label={"Insert answer after "+(j+1)+" in question "+(i+1)} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">Insert below</Button>
    <Button variant="secondary" type="button" disabled={q.options.length>=20}
     onClick={()=>updateQuestion(i,old=>({...old,options:facultyDuplicateQuizOption(old.options,j).map((o,k)=>k===j+1?{text:o.text,correct:o.correct,sequence:o.sequence,clientKey:draftOptionKey()}:o)}))}
     aria-label={"Duplicate answer "+(j+1)+" in question "+(i+1)} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">Duplicate</Button>
    <Button variant="secondary" type="button" disabled={q.options.length<=2}
     onClick={()=>{if(facultyQuizOptionRemovalNeedsConfirmation(q.options,j)){
       askConfirm(facultyQuizOptionRemovalPrompt(q.type,q.options,i,j),
         ()=>updateQuestion(i,old=>({...old,options:facultyRemoveQuizOption(old,j)})));return;
      }
      updateQuestion(i,old=>({...old,options:facultyRemoveQuizOption(old,j)}));}}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-2 py-1 text-xs">Remove</Button>
   </div>)}
   <Button variant="secondary" type="button" disabled={q.options.length>=20}
    onClick={()=>{setPasteQuestionIndex(i);setPastedChoices("");setError(null);}}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm">Paste choices</Button>
   <Button variant="secondary" type="button" disabled={q.options.length>=20}
    onClick={()=>updateQuestion(i,old=>({...old,options:[...old.options,{clientKey:draftOptionKey(),text:"",correct:false,sequence:old.options.length}]}))}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm">Add option</Button>
   <div className="flex flex-wrap gap-2">
    <Button variant="secondary" type="button" disabled={i===0} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestionToEdge(old,i,"FIRST"));}}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" to first"}>First</Button>
    <Button variant="secondary" type="button" disabled={i===0} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestion(old,i,i-1));}}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" up"}>Move up</Button>
    <Button variant="secondary" type="button" disabled={i===questions.length-1} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestion(old,i,i+1));}}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" down"}>Move down</Button>
    <Button variant="secondary" type="button" disabled={i===questions.length-1} onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyMoveQuizQuestionToEdge(old,i,"LAST"));}}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Move question "+(i+1)+" to last"}>Last</Button>
   </div>
   <Button variant="secondary" type="button" disabled={questions.length>=100}
    onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyInsertQuizQuestionAfter(old,i,{...fresh(),sequence:i+1}));}}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Insert question after "+(i+1)}>Insert below</Button>
   <Button variant="secondary" type="button" disabled={questions.length>=100}
    onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyDuplicateQuizQuestion(old,i).map((question,k)=>k===i+1?{...question,options:question.options.map(option=>({text:option.text,correct:option.correct,sequence:option.sequence,clientKey:draftOptionKey()}))}:question));}}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm" aria-label={"Duplicate question "+(i+1)}>Duplicate question</Button>
   <Button variant="secondary" type="button" disabled={questions.length<=1}
    onClick={()=>askConfirm(facultyQuizQuestionRemovalPrompt(i,q.prompt),()=>{
      setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyRemoveQuizQuestion(old,i));
     })}
     className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm">Remove question</Button>
  </fieldset>)}
  <Button variant="secondary" type="button" disabled={!editable||questions.length>=100}
   onClick={()=>{setConfirmed(false);setDirtyDraft(true);setQuestions(old=>facultyAppendQuizQuestion(old,{...fresh(),sequence:old.length}));}}
   className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm">Add question</Button>
  <div role="status" aria-live="polite" className="space-y-1 border-y border-border py-3 text-sm">
   <p className="font-semibold">Draft review: {review.questionCount} questions · {review.optionCount} options · {review.totalPoints} total points</p>
   <p>{review.missingCorrect===0?"Every question has a correct answer selected.":review.missingCorrect+" question(s) need a correct answer."}</p>
   <p>{reviewIssues.invalidQuestions===0?"All question formats pass validation.":reviewIssues.invalidQuestions+" question(s) need editing before save."}</p>
   {reviewIssues.overLimit?<Alert tone="error">Total points exceed the 10,000-point limit.</Alert>:null}
   <p className="text-xs text-muted-foreground">Review these draft values before saving or publishing.</p>
  </div>
  {chosen?.status==="DRAFT"&&dirtyDraft?
    <p role="status" className="text-sm text-body">You have unsaved changes. Save the draft before publishing.</p>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {facultyQuizCanRetryDetails(detailsFailed,chosen?.id,pending) ?
    <Button variant="secondary" type="button" onClick={()=>{if(facultyQuizRetryNeedsConfirmation(dirtyDraft,pending)){
       askConfirm("Discard unsaved Quiz metadata and retry loading the saved question bank?",()=>void choose(selected));return;
      }
      void choose(selected);}}
      className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-[650] text-primary-text">
      Reload Quiz questions
    </Button> : null}
  {success?<Alert tone="success">{success}</Alert>:null}
  <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center [&_button]:w-full sm:[&_button]:w-auto">
   {facultyQuizMayResetDraft(dirtyDraft,pending)?<Button variant="secondary" type="button" onClick={resetDraft}
    className="text-sm">Discard unsaved edits</Button>:null}
   {!chosen?<div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
    <Checkbox label="Publish now" checked={publishNow} disabled={pending}
        onChange={event=>setPublishNow(event.target.checked)}/>
    <Button variant="primary" type="button" disabled={pending||!lessonId}
    onClick={()=>void submit("CREATE")} className="min-h-11 md:min-h-9">{publishNow?"Create and publish":"Create draft"}</Button>
   </div>:
    <>
    <Button variant="secondary" type="button" disabled={!facultyQuizCanSaveChanges(chosen.status,dirtyDraft,detailsFailed,pending)}
     onClick={()=>void submit("EDIT")} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 py-2">{chosen.status==="DRAFT"?"Save draft":"Save metadata"}</Button>
    <Button variant="primary" type="button" disabled={pending||!facultyQuizReadyToPublish(chosen.status,dirtyDraft,detailsFailed,questions)}
     onClick={()=>void submit("PUBLISH")} className="min-h-11 md:min-h-9">Publish</Button>
    {chosen.status==="PUBLISHED"&&
     <Button variant="secondary" type="button" disabled={pending}
      onClick={()=>void submit("CLOSE")}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 py-2">
      Close quiz
     </Button>}
    {["DRAFT","PUBLISHED","CLOSED"].includes(chosen.status)&&
     <details className="min-w-0 border-t border-border pt-2 sm:ml-auto sm:border-t-0 sm:pt-0">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Archive quiz</summary>
      <Button variant="danger" type="button" disabled={pending} onClick={()=>void submit("ARCHIVE")}
       className="mt-2 min-h-11 md:min-h-9">Archive quiz</Button>
     </details>}
    </>}
  </div>
  <p className="text-xs text-muted-foreground">
   Each question needs unique nonblank options and valid correct answers; total points must not exceed 10000. Edits are blocked after publication or first attempt. Closing stops future attempts while keeping submitted results. Archiving hides the quiz from learner lists without deleting history and is refused after any attempt.
  </p>
 <Dialog open={pasteQuestionIndex!==null} onOpenChange={open=>{if(!open&&!pending)setPasteQuestionIndex(null);}}
   title="Paste choices"
   description="Paste up to 20 answer choices separated by a new line or |. Empty draft choices will be replaced."
   footer={<>
     <Button variant="secondary" className="min-h-11 flex-1 sm:flex-none md:min-h-9" disabled={pending} onClick={()=>setPasteQuestionIndex(null)}>Cancel</Button>
     <Button variant="primary" className="min-h-11 flex-1 sm:flex-none md:min-h-9" disabled={pending||pastedChoices.trim().length===0}
       onClick={()=>{
        const index=pasteQuestionIndex;if(index===null)return;
        const current=questions[index];if(!current){setPasteQuestionIndex(null);return;}
        const result=facultyQuizApplyPastedOptions(current.options,pastedChoices);
        if(!result.ok){setError(result.issue);return;}
        updateQuestion(index,old=>({...old,options:result.options}));
        setError(null);setPasteQuestionIndex(null);
       }}>Paste choices</Button>
   </>}>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Answer choices
     <Textarea value={pastedChoices} onChange={event=>setPastedChoices(event.target.value)}
       rows={8} maxLength={40000} aria-label="Answer choices" />
   </label>
   {error?<Alert tone="error" className="mt-3">{error}</Alert>:null}
 </Dialog>
 <ConfirmDialog open={confirmRequest!==null} onOpenChange={open=>{if(!open&&!pending)dismissConfirm();}}
     title={confirmRequest?.title??"Confirm Quiz action"} confirmVariant={confirmRequest?.variant??"danger"} pending={pending}
     onConfirm={acceptConfirm}/>
  </section>;
}
