"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {FINDING_STATUSES,FINDING_SEVERITIES} from "@/modules/bug-tracker/independent-audit-findings-model";
type Action="STATUS"|"SEVERITY"|"ASSIGNEE"|"DUPLICATE"|"FIX_COMMIT"|"COMMENT";
export function IndependentFindingActions({externalId,version,status,severity}:{externalId:string;version:number;status:string;severity:string}){
 const router=useRouter(),lock=useRef(false);
 const [action,setAction]=useState<Action>("STATUS");
 const [nextStatus,setNextStatus]=useState(status);
 const [nextSeverity,setNextSeverity]=useState(severity);
 const [assignee,setAssignee]=useState("");
 const [duplicateOf,setDuplicateOf]=useState("");
 const [repo,setRepo]=useState("42Students/lms-vnext");
 const [sha,setSha]=useState("");
 const [note,setNote]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 function body(){
  const base={action,expectedVersion:version};
  switch(action){
   case "STATUS":return {...base,status:nextStatus,...(note.trim()?{note:note.trim()}:{})};
   case "SEVERITY":return {...base,severity:nextSeverity};
   case "ASSIGNEE":return {...base,assignee:assignee.trim()||null};
   case "DUPLICATE":return {...base,duplicateOf:duplicateOf.trim()};
   case "FIX_COMMIT":return {...base,repo:repo.trim(),sha:sha.trim()};
   case "COMMENT":return {...base,note:note.trim()};
  }
 }
 async function submit(){
  if(lock.current)return;
  if((action==="COMMENT"||action==="STATUS"&&["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"].includes(nextStatus))&&note.trim().length<4){
   setError("Enter a reason of at least four characters.");return;
  }
  if(!window.confirm("Save this finding update? An immutable audit event will be recorded."))return;
  lock.current=true;setPending(true);setError(null);
  try{
   const result=await apiFetch<{ok:boolean;version:number}>("/api/tracker/audit-findings/"+encodeURIComponent(externalId),{
    method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body()),
   });
   if(!result.ok||result.version<=version)throw new Error("The update could not be verified. Refresh and retry.");
   router.refresh();
  }catch{setError(friendlyApiError({}));}
  finally{lock.current=false;setPending(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Finding actions">
  <h2 className="font-semibold">Update finding</h2>
  <label className="grid gap-1 text-sm">Action
   <select value={action} disabled={pending} onChange={e=>setAction(e.target.value as Action)}
    className="min-h-10 rounded border border-border bg-surface px-3">
    {(["STATUS","SEVERITY","ASSIGNEE","DUPLICATE","FIX_COMMIT","COMMENT"] as const).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
   </select>
  </label>
  {action==="STATUS"?<label className="grid gap-1 text-sm">Status
   <select value={nextStatus} disabled={pending} onChange={e=>setNextStatus(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2">
    {FINDING_STATUSES.map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
   </select></label>:null}
  {action==="SEVERITY"?<label className="grid gap-1 text-sm">Severity
   <select value={nextSeverity} disabled={pending} onChange={e=>setNextSeverity(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2">
    {FINDING_SEVERITIES.map(value=><option key={value}>{value}</option>)}
   </select></label>:null}
  {action==="ASSIGNEE"?<label className="grid gap-1 text-sm">Assignee
   <input value={assignee} disabled={pending} maxLength={150} onChange={e=>setAssignee(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2"/>
   </label>:null}
  {action==="DUPLICATE"?<label className="grid gap-1 text-sm">Duplicate of finding UUID
   <input value={duplicateOf} disabled={pending} onChange={e=>setDuplicateOf(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2"/>
   </label>:null}
  {action==="FIX_COMMIT"?<div className="grid gap-2">
   <label className="grid gap-1 text-sm">Repository
    <input value={repo} disabled={pending} onChange={e=>setRepo(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2"/></label>
   <label className="grid gap-1 text-sm">Commit SHA
    <input value={sha} disabled={pending} maxLength={40} onChange={e=>setSha(e.target.value)} className="min-h-10 rounded border border-border bg-surface p-2"/></label>
   </div>:null}
  {(action==="COMMENT"||action==="STATUS")?<label className="grid gap-1 text-sm">Note or reason
    <textarea rows={3} maxLength={1000} value={note} disabled={pending} onChange={e=>setNote(e.target.value)} className="rounded border border-border bg-surface p-2"/>
   </label>:null}
  <button type="button" onClick={()=>void submit()} disabled={pending}
   className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">{pending?"Saving…":"Save details"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
