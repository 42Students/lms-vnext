"use client";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import { useState } from "react";
import {
 tpoStudentNudgeTemplates,tpoStudentNudgeLabels,
 tpoStudentNudgeInputSchema,type TpoStudentNudgeTemplate,
} from "@/modules/placements/tpo-student-nudge-send-model";

type Row={id:string;label:string;registered:boolean|null};
export function TpoStudentNudgePanel({rows}:{rows:readonly Row[]}){
 const [selected,setSelected]=useState<string[]>([]);
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
  className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Send a message</h2>
  <p className="text-sm text-body">Choose up to 25 learners on this page. Messages are delivered in-app and audited.</p>
  <label className="flex items-center gap-2 text-sm">
   <input type="checkbox" checked={validSelected.length===Math.min(rows.length,25)}
    disabled={pending} onChange={e=>setSelected(e.target.checked?rows.slice(0,25).map(row=>row.id):[])} />
   Select first {Math.min(rows.length,25)} on this page
  </label>
  <div className="max-h-48 space-y-1 overflow-y-auto">
   {rows.map(row=><label key={row.id} className="flex min-h-9 items-center gap-2 text-sm">
    <input type="checkbox" checked={validSelected.includes(row.id)}
     disabled={pending||(!validSelected.includes(row.id)&&validSelected.length>=25)}
     onChange={e=>setSelected(current=>e.target.checked?[...current,row.id]:current.filter(id=>id!==row.id))}/>
    {row.label}{row.registered===false?<span className="text-xs text-muted-foreground">(not in placements)</span>:null}
   </label>)}
  </div>
  <p role="status" className="text-xs text-muted-foreground">{validSelected.length} selected;
   {outside} not registered for placements (messages still deliver).</p>
  <label className="grid gap-1 text-sm">Message template
   <select value={template} disabled={pending} className="min-h-10 rounded border border-border bg-surface px-3"
    onChange={e=>setChoice(e.target.value as TpoStudentNudgeTemplate)}>
    {Object.entries(tpoStudentNudgeLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm">Message
   <textarea rows={3} minLength={5} maxLength={1000} required
    className="w-full rounded border border-border bg-surface p-3"
    disabled={pending} value={message} onChange={e=>{setMessage(e.target.value);setNotice("");}}/>
  </label>
  <button type="button" disabled={pending||guardedPending||!validSelected.length}
   className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
   onClick={()=>setConfirmOpen(true)}>{"Send to "+validSelected.length+" selected"}</button>
  <Dialog open={confirmOpen} onOpenChange={value=>{if(!pending&&!guardedPending)setConfirmOpen(value);}}
   title="Send a message" description={"Send an in-app message to "+validSelected.length+" learner(s)? The message will be audited."}
   footer={<><Button variant="secondary" disabled={pending||guardedPending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
    <Button disabled={pending||guardedPending||!validSelected.length} onClick={()=>void runGuarded(send)}>
      {pending||guardedPending?"Sending…":"Confirm send"}
    </Button></>}>
   <p className="text-sm">The student will see this message in their LMS notifications.</p>
  </Dialog>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
