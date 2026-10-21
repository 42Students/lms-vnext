"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { useState } from "react";
import {useTpoStudentsSelection} from "@/components/tpo/tpo-students-selection";
import {
 tpoStudentNudgeTemplates,tpoStudentNudgeLabels,
 tpoStudentNudgeInputSchema,type TpoStudentNudgeTemplate,
} from "@/modules/placements/tpo-student-nudge-send-model";

type Row={id:string;label:string;registered:boolean|null};
export function TpoStudentNudgePanel({rows}:{rows:readonly Row[]}){
 const [localSelected,setLocalSelected]=useState<string[]>([]);
 const shared=useTpoStudentsSelection();
 const selected=shared?.selected??localSelected;
 const setSelected=shared?.setSelected??setLocalSelected;
 const [template,setTemplate]=useState<TpoStudentNudgeTemplate>("REGISTRATION");
 const [message,setMessage]=useState<string>(tpoStudentNudgeTemplates.REGISTRATION);
 const [pending,setPending]=useState(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const eligible=new Set(rows.map(row=>row.id));
 const validSelected=selected.filter(id=>eligible.has(id));
 const outside=rows.filter(row=>validSelected.includes(row.id)&&!row.registered).length;
 function setChoice(code:TpoStudentNudgeTemplate){
  setTemplate(code);setMessage(tpoStudentNudgeTemplates[code]);setError("");setNotice("");
 }
 async function send(){
  const parsed=tpoStudentNudgeInputSchema.safeParse({
   learnerMembershipIds:validSelected,template,message,
  });
  if(!parsed.success){setError(parsed.error.issues[0]?.message??"Check recipients and message.");return;}
  setPending(true);setError("");setNotice("");
  try{
   const data=await apiFetch<{sent?:number;skipped?:number}>("/api/placements/tpo/students/nudges",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(parsed.data),
   });
   setNotice(String(data?.sent??0)+" sent; "+String(data?.skipped??0)+" already delivered today.");
   setSelected([]);setConfirmOpen(false);
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not send follow-up.");}
  finally{setPending(false);}
 }
 if(!rows.length)return null;
 return <section aria-label="Send a message to students"
  className="min-w-0 space-y-3 border-y border-border py-4">
  <h2 className="font-semibold">Send a message</h2>
  <p className="text-sm text-body">Choose up to 25 learners on this page. Messages are delivered in-app and audited.</p>
  <label className="flex min-h-11 min-w-0 items-center gap-2 text-sm">
   <Checkbox checked={validSelected.length===Math.min(rows.length,25)}
    disabled={pending} onChange={e=>setSelected(e.target.checked?rows.slice(0,25).map(row=>row.id):[])} />
   Select first {Math.min(rows.length,25)} on this page
  </label>
  <ScrollCue axis="y" label="Students available for message" className="min-w-0 border-y border-border" viewportClassName="max-h-48 space-y-0 py-1">
   {rows.map(row=><label key={row.id} className="flex min-h-11 min-w-0 items-start gap-3 border-b border-border px-2 py-2 text-sm last:border-b-0 hover:bg-[var(--lms-neutral-50)]">
    <Checkbox checked={validSelected.includes(row.id)}
     disabled={pending||guardedPending||(!validSelected.includes(row.id)&&validSelected.length>=25)} className="mt-1 shrink-0"
     onChange={e=>setSelected(current=>e.target.checked?[...current,row.id]:current.filter(id=>id!==row.id))}/>
    <span className="min-w-0 flex-1 break-words">{row.label}{row.registered===false?<span className="ml-1 text-xs text-muted-foreground">(not in placements)</span>:null}</span>
   </label>)}
  </ScrollCue>
  <p role="status" className="min-w-0 break-words text-xs text-muted-foreground">{validSelected.length} selected;
   {outside} not registered for placements (messages still deliver).</p>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message template
   <Select className="w-full min-w-0" value={template} disabled={pending||guardedPending} 
    onChange={e=>setChoice(e.target.value as TpoStudentNudgeTemplate)}>
    {Object.entries(tpoStudentNudgeLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
   </Select>
  </label>
  <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message
   <Textarea className="w-full min-w-0" rows={4} minLength={5} maxLength={1000} required
    
    disabled={pending||guardedPending} value={message} onChange={e=>{setMessage(e.target.value);setNotice("");}}/>
  </label>
  <Button type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||guardedPending||!validSelected.length||message.trim().length<5}
   onClick={()=>setConfirmOpen(true)}>{"Send to "+validSelected.length+" selected"}</Button>
  <Dialog open={confirmOpen} onOpenChange={value=>{if(!pending&&!guardedPending)setConfirmOpen(value);}}
   title="Send a message" description={"Send an in-app message to "+validSelected.length+" learner(s)? The message will be audited."}
   footer={<div className="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
     <Button variant="secondary" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={pending||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
     <Button className="min-h-11 w-full md:w-auto md:min-h-9" loading={pending||guardedPending} disabled={!validSelected.length||message.trim().length<5} onClick={()=>void runGuarded(send)}>
      {pending||guardedPending?"Sending…":"Confirm send"}
     </Button>
   </div>}>
   <div className="min-w-0 space-y-3">
    <p className="text-sm">The student will see this message in their LMS notifications.</p>
    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words border-t border-border pt-3 text-sm text-body">{message}</p>
    {error?<InlineNotice tone="error" message={error}/>:null}
   </div>
  </Dialog>
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  {error&&!confirmOpen?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
