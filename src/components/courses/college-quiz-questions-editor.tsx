"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import type { ComponentPropsWithRef } from "react";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Question={type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;
 options:{text:string;correct:boolean}[]};
function CorrectAnswerInput({ multiple, ...props }: Omit<ComponentPropsWithRef<"input">, "type"> & { multiple: boolean }) {
 return multiple ? <Checkbox {...props} /> : <Radio {...props} />;
}
const empty=():Question=>({type:"SINGLE_CHOICE",prompt:"",points:1,
 options:[{text:"",correct:true},{text:"",correct:false}]});
export function CollegeQuizQuestionsEditor({quizId}:{quizId:string}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const [questions,setQuestions]=useState<Question[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [dirty,setDirty]=useState(false);
 async function load(){
  if(loading||busy)return;
  setOpen(true);setLoading(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/courses/quizzes/"+encodeURIComponent(quizId)+"?includeCorrectAnswers=true",{cache:"no-store"});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!Array.isArray(body?.quiz?.questions)&&!Array.isArray(body?.questions))
    throw new Error(typeof body?.error==="string"?body.error:"Unable to load quiz questions.");
   const rows=Array.isArray(body?.questions)?body.questions:body.quiz.questions;
   setDirty(false);
   setQuestions(rows.map((q:Question)=>({type:q.type,prompt:q.prompt,points:q.points,
    options:q.options.map(o=>({text:o.text,correct:Boolean(o.correct)}))})));
  }catch(cause){setOpen(false);setQuestions([]);
   setError(cause instanceof Error?cause.message:"Unable to load quiz questions.");}
  finally{setLoading(false);}
 }
 function update(i:number,question:Question){setDirty(true);setQuestions(prev=>prev.map((q,j)=>i===j?question:q));}
 async function save(){
  if(busy)return;
  if(questions.length<1||questions.length>100){setError("Add 1–100 questions.");return;}
  for(const q of questions){
   const labels=q.options.map(x=>x.text.trim());
   if(!q.prompt.trim()||!Number.isInteger(q.points)||q.points<1||q.points>1000||
    labels.length<2||labels.length>20||labels.some(x=>!x)||
    new Set(labels.map(x=>x.toLowerCase())).size!==labels.length||
    !q.options.some(x=>x.correct)||
    (q.type==="SINGLE_CHOICE"&&q.options.filter(x=>x.correct).length!==1)||
    (q.type==="MULTIPLE_CHOICE"&&q.options.every(x=>x.correct))){
    setError("Complete every question, unique option and correct answer.");return;
   }
  }
  if(questions.reduce((total,q)=>total+q.points,0)>10000){
   setError("Quiz total points may not exceed 10000.");return;
  }
  if(!window.confirm("Save changed quiz questions? Draft question edits replace the saved question bank."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/courses/quizzes/"+encodeURIComponent(quizId),{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({questions:questions.map((q,i)=>({...q,prompt:q.prompt.trim(),sequence:i,
     options:q.options.map((option,j)=>({...option,text:option.text.trim(),sequence:j}))}))}),
   });
   const body=await response.json().catch(()=>null);
   if(!response.ok||body?.quiz?.id!==quizId)throw new Error(body?.error??"Quiz questions could not be updated.");
   setDirty(false);setOpen(false);setNotice("Quiz questions updated.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update questions.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-2">
  <Button variant="secondary" type="button" disabled={busy||loading} onClick={()=>open?(dirty?window.confirm("Discard unsaved Quiz question changes?")&&(setOpen(false),setDirty(false)):setOpen(false)):void load()}
   className="min-h-11 md:min-h-9">
   {loading?"Loading…":open?"Close questions":"Edit questions"}</Button>
  {open&&!loading?<div className="max-h-[32rem] space-y-3 overflow-auto rounded border border-border p-3">
   {questions.map((q,i)=><fieldset key={i} className="space-y-2 rounded border border-border p-2">
    <legend className="text-xs font-semibold">Question {i+1}</legend>
    <Select value={q.type} onChange={e=>update(i,{...q,type:e.target.value as Question["type"],
     options:q.options.map((o,j)=>({...o,correct:j===0}))})} disabled={busy}
     className="min-h-11 text-xs md:min-h-9">
     <option value="SINGLE_CHOICE">Single choice</option><option value="MULTIPLE_CHOICE">Multiple choice</option>
    </Select>
    <Input type="number" aria-label={"Question "+(i+1)+" points"} min={1} max={1000}
     value={q.points} disabled={busy} onChange={e=>update(i,{...q,points:Number(e.target.value)})}
     className="ml-2 min-h-11 w-20 text-xs md:min-h-9"/>
    <Textarea aria-label={"Question "+(i+1)+" prompt"} value={q.prompt} maxLength={5000} rows={2}
     onChange={e=>update(i,{...q,prompt:e.target.value})} disabled={busy}
     className="w-full text-xs"/>
    {q.options.map((o,j)=><label key={j} className="flex min-h-11 min-w-0 items-center gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
     <CorrectAnswerInput multiple={q.type==="MULTIPLE_CHOICE"} name={"correct-"+quizId+"-"+i}
      checked={o.correct} disabled={busy} onChange={e=>update(i,{...q,options:q.options.map((option,k)=>({
       ...option,correct:q.type==="SINGLE_CHOICE"?k===j:k===j?e.target.checked:option.correct}))})}/>
     <Input value={o.text} maxLength={2000} disabled={busy} aria-label={"Option "+(j+1)}
      onChange={e=>update(i,{...q,options:q.options.map((option,k)=>k===j?{...option,text:e.target.value}:option)})}
      className="min-h-11 min-w-0 flex-1 md:min-h-9"/>
     {q.options.length>2?<Button variant="danger" type="button" className="min-h-11 md:min-h-9" disabled={busy}
      onClick={()=>update(i,{...q,options:q.options.filter((_,k)=>k!==j)})}>Remove</Button>:null}
    </label>)}
    <div className="flex flex-wrap gap-3 text-xs">
     <Button variant="ghost" type="button" disabled={busy||q.options.length>=20}
      onClick={()=>update(i,{...q,options:[...q.options,{text:"",correct:false}]})}
      className="min-h-11 md:min-h-9">+ Option</Button>
     {questions.length>1?<Button variant="danger" type="button" disabled={busy} className="min-h-11 md:min-h-9"
      onClick={()=>{setDirty(true);setQuestions(prev=>prev.filter((_,k)=>k!==i));}}>Remove question</Button>:null}
    </div>
   </fieldset>)}
   <div className="flex flex-wrap gap-2">
    <Button variant="secondary" type="button" disabled={busy||questions.length>=100} onClick={()=>{setDirty(true);setQuestions(rows=>[...rows,empty()]);}}
     className="min-h-11 md:min-h-9">+ Add question</Button>
    <Button variant="primary" type="button" loading={busy} disabled={busy} onClick={()=>void save()} className="min-h-11 md:min-h-9"
     >
     {busy?"Saving…":"Save questions"}</Button>
   </div>
  </div>:null}
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
 </section>;
}
