"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {authoringLocalDateTime,authoringDueInstant}
 from "@/modules/courses/faculty-authoring-datetime-model";
import {facultyAuthoringQuestionsFromResponse,facultyQuizDraftIssue,facultyChangeQuizChoiceType,facultyQuizDraftEditable,facultyQuizMetadataEditable,facultyToggleQuizAnswer,facultyRemoveQuizOption,facultyQuizConfirmationAfterEdit,facultyRemoveQuizQuestion,facultyAppendQuizQuestion,facultyQuizDraftLoadAllowsAction,facultyQuizMetadataIssue,facultyQuizWriteMessage}
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
 const [success,setSuccess]=useState<string|null>(null);
 const [selected,setSelected]=useState("");
 const [lessonId,setLessonId]=useState(lessons[0]?.id??"");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [dueAt,setDueAt]=useState("");
 const [maxAttempts,setMaxAttempts]=useState(1);
 const [questions,setQuestions]=useState<Question[]>([fresh()]);
 const [confirmed,setConfirmed]=useState(false);
 const [pending,setPending]=useState(false);
 const [detailsFailed,setDetailsFailed]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const chosen=quizzes.find(q=>q.id===selected);
 const editable=!pending && facultyQuizDraftEditable(chosen?.status);
 const metadataEditable=!pending && facultyQuizMetadataEditable(chosen?.status);
 async function choose(id:string){
  const token=++choiceRequest.current;
  setSelected(id);setConfirmed(false);setError(null);setSuccess(null);setDetailsFailed(false);
  const q=quizzes.find(x=>x.id===id);
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
   setQuestions(facultyAuthoringQuestionsFromResponse(response));
  }catch(e){if(token===choiceRequest.current){setError(e instanceof Error?e.message:"Quiz details unavailable");setQuestions([]);setDetailsFailed(true);}}
  finally{if(token===choiceRequest.current)setPending(false);}
 }
 function updateQuestion(i:number,fn:(q:Question)=>Question){
  setQuestions(old=>old.map((q,n)=>n===i?fn(q):q));setConfirmed(false);
 }
 async function submit(action:"CREATE"|"EDIT"|"PUBLISH"|"CLOSE"|"ARCHIVE"){
  if(!confirmed){setError("Confirm the action before saving.");return;}
  if(pending)return;
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
    const issue=facultyQuizMetadataIssue(title,description,dueAt,maxAttempts);
    if(issue){setError(issue);return;}
  }
  const warning=action==="ARCHIVE" ?
    "Archive this Section Quiz? Learners will no longer see it. Quizzes with attempts cannot be archived." :
    action==="CLOSE" ?
    "Close this published Section Quiz? New learner attempts stop; existing attempts and grades remain." :
    "Confirm "+action.toLowerCase()+" for this Section Quiz?";
  if(!window.confirm(warning))return;
  setError(null);setSuccess(null);setPending(true);
  try{
   const body=(action==="PUBLISH"||action==="CLOSE"||action==="ARCHIVE")?{
     action,quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt,confirmed:true,
   }:{
     action,confirmed:true,
     ...(action==="CREATE"?{lessonId,
       sequence:Math.max(0,...quizzes.filter(x=>x.lessonId===lessonId).map(x=>x.sequence+1))}
       :{quizId:chosen?.id,expectedUpdatedAt:chosen?.updatedAt}),
     title,description:description||null,dueAt:authoringDueInstant(dueAt),
     maxAttempts,
     ...(action==="CREATE" || chosen?.status==="DRAFT" ? {questions:questions.map((q,i)=>({
      ...q,sequence:i,options:q.options.map((o,j)=>({...o,sequence:j})),
     }))} : {}),
   };
   const res=await fetch("/api/courses/faculty/quizzes/"+encodeURIComponent(deliveryId)+"/command",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
   });
   if(!res.ok){
     const failure:unknown=await res.json().catch(()=>null);
     throw new Error(facultyQuizWriteMessage(failure));
   }
   setConfirmed(false);setSuccess("Quiz "+action.toLowerCase()+" completed.");
   if(action==="ARCHIVE"){
     ++choiceRequest.current;
     setSelected("");setTitle("");setDescription("");setDueAt("");
     setMaxAttempts(1);setQuestions([fresh()]);setLessonId(lessons[0]?.id??"");
   }
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}
  finally{setPending(false);}
 }
 return <section className="min-w-0 w-full max-w-full space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Choice-question quiz builder</h2>
  <label className="grid min-w-0 gap-1 text-sm">Quiz
   <select value={selected} disabled={pending} onChange={e=>void choose(e.target.value)}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2">
    <option value="">Create new draft</option>
    {quizzes.map(q=><option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
   </select></label>
  {chosen?<p className="text-xs text-body">State: {chosen.status}; published quizzes and attempted quizzes cannot change their questions.</p>:null}
  {!chosen?<label className="grid min-w-0 gap-1 text-sm">Lesson
   <select value={lessonId} onChange={e=>{setConfirmed(false);setLessonId(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2">
    {lessons.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
   </select></label>:null}
  <label className="grid min-w-0 gap-1 text-sm">Quiz title
   <input value={title} disabled={!metadataEditable} maxLength={255} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,title,e.target.value));setTitle(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Instructions
   <textarea value={description} disabled={!metadataEditable} maxLength={10000} rows={2}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,description,e.target.value));setDescription(e.target.value);}}
    className="min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Due date (IST, optional)
   <input type="datetime-local" disabled={!metadataEditable} value={dueAt} onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,dueAt,e.target.value));setDueAt(e.target.value);}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  <label className="grid min-w-0 gap-1 text-sm">Maximum attempts
   <input type="number" disabled={!editable} min={1} max={20} value={maxAttempts}
    onChange={e=>{setConfirmed(facultyQuizConfirmationAfterEdit(confirmed,maxAttempts,Number(e.target.value)));setMaxAttempts(Number(e.target.value));}}
    className="min-h-10 min-w-0 max-w-full rounded border border-border p-2"/></label>
  {questions.map((q,i)=><fieldset key={i} disabled={!editable}
   className="min-w-0 max-w-full space-y-3 rounded-lg border border-border p-4">
   <legend className="text-sm font-semibold">Question {i+1}</legend>
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
    <button type="button" disabled={q.options.length<=2}
     onClick={()=>updateQuestion(i,old=>({...old,options:facultyRemoveQuizOption(old,j)}))}
     className="rounded border border-border px-2 py-1 text-xs">Remove</button>
   </div>)}
   <button type="button" disabled={q.options.length>=20}
    onClick={()=>updateQuestion(i,old=>({...old,options:[...old.options,{text:"",correct:false,sequence:old.options.length}]}))}
    className="rounded border border-border px-3 py-2 text-sm">Add option</button>
   <button type="button" disabled={questions.length<=1}
    onClick={()=>{setConfirmed(false);setQuestions(old=>facultyRemoveQuizQuestion(old,i));}}
    className="ml-2 rounded border border-border px-3 py-2 text-sm">Remove question</button>
  </fieldset>)}
  <button type="button" disabled={!editable||questions.length>=100}
   onClick={()=>{setConfirmed(false);setQuestions(old=>facultyAppendQuizQuestion(old,{...fresh(),sequence:old.length}));}}
   className="rounded border border-border px-4 py-2 text-sm">Add question</button>
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed}
   onChange={e=>setConfirmed(e.target.checked)}/>
   I confirm these choices, point totals and the current draft state.
  </label>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="text-sm text-body">{success}</p>:null}
  <div className="flex flex-wrap gap-3">
   {!chosen?<button type="button" disabled={!confirmed||pending||!lessonId}
    onClick={()=>void submit("CREATE")} className="rounded bg-primary px-4 py-2 text-on-primary">Create draft</button>:
    <>
    <button type="button" disabled={!confirmed||pending||!facultyQuizMetadataEditable(chosen.status)||
      (chosen.status==="DRAFT"&&detailsFailed)}
     onClick={()=>void submit("EDIT")} className="rounded border border-border px-4 py-2">{chosen.status==="DRAFT"?"Save draft":"Save metadata"}</button>
    <button type="button" disabled={!confirmed||pending||chosen.status!=="DRAFT"||detailsFailed}
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
