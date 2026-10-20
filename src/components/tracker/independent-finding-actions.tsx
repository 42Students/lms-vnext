"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {FINDING_STATUSES,FINDING_SEVERITIES} from "@/modules/bug-tracker/independent-audit-findings-model";
import {canTransitionIndependentFinding,type IndependentFindingStatus} from "@/modules/bug-tracker/independent-finding-transition-model";
type Action="STATUS"|"SEVERITY"|"ASSIGNEE"|"DUPLICATE"|"FIX_COMMIT"|"COMMENT";
export function IndependentFindingActions({externalId,version,status,severity,candidates=[]}:{externalId:string;version:number;status:string;severity:string;candidates?:readonly {id:string;externalId:string;title:string}[]}){
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
  const [confirmOpen,setConfirmOpen]=useState(false);
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
 async function submit(confirmed=false){
  if(lock.current)return;
  if((action==="COMMENT"||action==="STATUS"&&["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"].includes(nextStatus))&&note.trim().length<4){
   setError("Enter a reason of at least four characters.");return;
  }
  if(!confirmed){setConfirmOpen(true);return;}
  lock.current=true;setPending(true);setError(null);
  try{
   const result=await apiFetch<{ok:boolean;version:number}>("/api/tracker/audit-findings/"+encodeURIComponent(externalId),{
    method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body()),
   });
   if(!result.ok||result.version<=version)throw new Error("The update could not be verified. Refresh and retry.");
   router.refresh();
  }catch{setError(friendlyApiError({}));}
  finally{lock.current=false;setPending(false);setConfirmOpen(false);}
 }
 return <section className="space-y-3 border-b border-border pb-4" aria-label="Finding actions">
  <h2 className="font-semibold">Update finding</h2>
  <label className="grid min-w-0 w-full gap-1 text-sm">Action
   <Select value={action} disabled={pending} onChange={e=>setAction(e.target.value as Action)}
    className="min-h-11 text-sm md:min-h-9">
    {(["STATUS","SEVERITY","ASSIGNEE","DUPLICATE","FIX_COMMIT","COMMENT"] as const).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
   </Select>
  </label>
  {action==="STATUS"?<label className="grid min-w-0 w-full gap-1 text-sm">Status
   <Select value={nextStatus} disabled={pending} onChange={e=>setNextStatus(e.target.value)} className="min-h-11 text-sm md:min-h-9">
    {FINDING_STATUSES.map(value=><option key={value} value={value}
      disabled={!canTransitionIndependentFinding(status as IndependentFindingStatus,value,"Reason supplied")}>
      {value.replaceAll("_"," ")}</option>)}
   </Select></label>:null}
  {action==="SEVERITY"?<label className="grid min-w-0 w-full gap-1 text-sm">Severity
   <Select value={nextSeverity} disabled={pending} onChange={e=>setNextSeverity(e.target.value)} className="min-h-11 text-sm md:min-h-9">
    {FINDING_SEVERITIES.map(value=><option key={value}>{value}</option>)}
   </Select></label>:null}
  {action==="ASSIGNEE"?<label className="grid min-w-0 w-full gap-1 text-sm">Assignee
   <Input value={assignee} disabled={pending} maxLength={150} onChange={e=>setAssignee(e.target.value)} className="min-h-11 text-sm md:min-h-9"/>
   </label>:null}
  {action==="DUPLICATE"?<label className="grid min-w-0 w-full gap-1 text-sm">Duplicate of finding UUID
   <Input value={duplicateOf} list="finding-duplicate-candidates" disabled={pending}
    onChange={e=>setDuplicateOf(e.target.value)}
    placeholder="Select a matching finding"
    className="min-h-11 text-sm md:min-h-9"/>
   <datalist id="finding-duplicate-candidates">{candidates.map(item=><option key={item.id}
     value={item.id}>{item.externalId} · {item.title}</option>)}</datalist>
   </label>:null}
  {action==="FIX_COMMIT"?<div className="grid gap-2">
   <label className="grid min-w-0 w-full gap-1 text-sm">Repository
    <Input value={repo} disabled={pending} onChange={e=>setRepo(e.target.value)} className="min-h-11 text-sm md:min-h-9"/></label>
   <label className="grid min-w-0 w-full gap-1 text-sm">Commit SHA
    <Input value={sha} disabled={pending} maxLength={40} onChange={e=>setSha(e.target.value)} className="min-h-11 text-sm md:min-h-9"/></label>
   </div>:null}
  {(action==="COMMENT"||action==="STATUS")?<label className="grid min-w-0 w-full gap-1 text-sm">Note or reason
    <Textarea rows={3} maxLength={1000} value={note} disabled={pending} onChange={e=>setNote(e.target.value)} className="min-h-11 text-sm md:min-h-9"/>
   </label>:null}
  <Button variant="primary" type="button" onClick={()=>void submit()} disabled={pending} className="min-h-11 w-full md:min-h-9 md:w-auto">{pending?"Saving…":"Save details"}</Button>
  {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
    title="Save this finding update? An immutable audit event will be recorded."
    confirmLabel="Save details" confirmVariant="primary" pending={pending}
    onConfirm={()=>void submit(true)}>
    {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </section>;
}
