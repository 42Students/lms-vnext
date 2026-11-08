"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {FINDING_STATUSES,FINDING_SEVERITIES} from "@/modules/bug-tracker/independent-audit-findings-model";
import {FINDING_COMMIT_REPOS} from "@/modules/bug-tracker/independent-finding-actions-model";
import {canTransitionIndependentFinding,type IndependentFindingStatus} from "@/modules/bug-tracker/independent-finding-transition-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
type Action="STATUS"|"SEVERITY"|"ASSIGNEE"|"DUPLICATE"|"FIX_COMMIT"|"COMMENT";
export function IndependentFindingActions({externalId,version,status,severity,currentAssignee,candidates=[],onUpdated}:{externalId:string;version:number;status:string;severity:string;currentAssignee:string|null;candidates?:readonly {id:string;externalId:string;title:string}[];onUpdated?:()=>void}){
 const router=useRouter(),lock=useRef(false);
 const [action,setAction]=useState<Action>("STATUS");
 const [nextStatus,setNextStatus]=useState(status);
 const [nextSeverity,setNextSeverity]=useState(severity);
 const [assignee,setAssignee]=useState(currentAssignee??"");
 const [duplicateOf,setDuplicateOf]=useState("");
 const [repo,setRepo]=useState<(typeof FINDING_COMMIT_REPOS)[number]>("lms2-fe");
 const [sha,setSha]=useState("");
 const [note,setNote]=useState("");
 const [pending,setPending]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [stale,setStale]=useState(false);
 // A server refresh may reuse this client component for another finding.
 // Do not carry private drafts or a previous finding's version into it.
 useEffect(()=>{
  setAction("STATUS");
  setNextStatus(status);
  setNextSeverity(severity);
  setAssignee(currentAssignee??"");
  setDuplicateOf("");
  setRepo("lms2-fe");
  setSha("");
  setNote("");
  setConfirmOpen(false);
  setError(null);
  setStale(false);
 },[externalId,version,status,severity,currentAssignee]);
 const submitLabel=action==="COMMENT"?"Add comment":action==="STATUS"?"Set to status":
  action==="SEVERITY"?"Update severity":action==="ASSIGNEE"?"Assign":
  action==="DUPLICATE"?"Mark duplicate":"Attach fix commit";
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
  if(lock.current||stale)return;
  if(action==="COMMENT"&&!note.trim()){setError("Write a comment");return;}
  if(action==="STATUS"&&nextStatus===status){setError("It is already "+status.replaceAll("_"," "));return;}
  if(action==="SEVERITY"&&nextSeverity===severity){setError("It is already "+severity);return;}
  if(action==="ASSIGNEE"&&assignee.trim().length>100){setError("Keep the name under 100 characters");return;}
  if(action==="DUPLICATE"&&(!duplicateOf.trim()||duplicateOf.trim()===externalId)){setError("Choose the finding this repeats");return;}
  if(action==="STATUS"&&["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"].includes(nextStatus)&&!note.trim()){
   setError("Say why (for \"verified\": what you re-tested)");return;
  }
  if(action==="STATUS"&&["VERIFIED","DUPLICATE","WONT_FIX","CANT_REPRODUCE"].includes(status)&&
    !["VERIFIED","DUPLICATE","WONT_FIX","CANT_REPRODUCE"].includes(nextStatus)&&!note.trim()){
    setError("Say why it is being reopened");return;
  }
  if(action==="FIX_COMMIT"&&!/^[0-9a-f]{7,40}$/.test(sha.trim())){setError("That isn't a commit hash");return;}
  setError(null);
  if(!confirmed){setConfirmOpen(true);return;}
  lock.current=true;setPending(true);setError(null);
  try{
   const result=await apiFetch<{ok:boolean;version:number}>("/api/tracker/audit-findings/"+encodeURIComponent(externalId),{
    method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body()),
   });
   if(!result.ok||result.version<=version)throw new Error("The update could not be verified. Refresh and retry.");
   setConfirmOpen(false);
   setStale(true); // Block another save until a fresh server version is rendered.
   onUpdated?.();
   router.refresh();
  }catch(reason){
   if(reason instanceof FriendlyFetchError){
    if(reason.code==="STALE_VERSION"||reason.status===409)setStale(true);
    const messages:Record<string,string>={
     STALE_VERSION:"The finding changed. Refresh and retry.",
     INVALID_STATUS_TRANSITION:"This status change is not allowed. Check the finding history and choose a valid next step.",
     SEVERITY_UNCHANGED:"It is already "+nextSeverity,
     ASSIGNEE_UNCHANGED:"The assignee has not changed",
     INVALID_DUPLICATE:"Choose the finding this repeats",
     DUPLICATE_TARGET_NOT_FOUND:"That finding doesn\'t exist",
     DUPLICATE_COMMIT:"This commit is already recorded.",
     NOT_FOUND:"Finding not found",
     NOT_READY:"Audit findings storage is not verified.",
    };
    setError(messages[reason.code??""]??reason.fieldErrors["reason"]??reason.fieldErrors["note"]??
      reason.fieldErrors["duplicateOf"]??reason.fieldErrors["assignee"]??reason.fieldErrors["sha"]??reason.fieldErrors["repo"]??reason.message);
   }else setError(reason instanceof Error?reason.message:friendlyApiError({}));
  }
  finally{lock.current=false;setPending(false);}
 }
 return <section className="min-w-0 max-w-3xl space-y-3 border-b border-border pb-4" aria-label="Finding actions">
  <Heading level={2} className="text-foreground">Update finding</Heading>
  <div className="grid min-w-0 gap-3 md:grid-cols-2">
  <Label stack className="min-w-0 w-full">Action
   <Select value={action} disabled={pending||stale} onChange={e=>{setAction(e.target.value as Action);setError(null);setConfirmOpen(false);}}
    className="min-h-11 text-sm md:min-h-9">
    {(["STATUS","SEVERITY","ASSIGNEE","DUPLICATE","FIX_COMMIT","COMMENT"] as const).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
   </Select>
  </Label>
  {action==="STATUS"?<Label stack className="min-w-0 w-full">Status
   <Select value={nextStatus} disabled={pending||stale} onChange={e=>setNextStatus(e.target.value)} className="min-h-11 text-sm md:min-h-9">
    {FINDING_STATUSES.map(value=><option key={value} value={value}
      disabled={!canTransitionIndependentFinding(status as IndependentFindingStatus,value,"Reason supplied")}>
      {value.replaceAll("_"," ")}</option>)}
   </Select></Label>:null}
  {action==="SEVERITY"?<Label stack className="min-w-0 w-full">Severity
   <Select value={nextSeverity} disabled={pending||stale} onChange={e=>setNextSeverity(e.target.value)} className="min-h-11 text-sm md:min-h-9">
    {FINDING_SEVERITIES.map(value=><option key={value}>{value}</option>)}
   </Select></Label>:null}
  {action==="ASSIGNEE"?<Label stack className="min-w-0 w-full">Assigned to
   <Input value={assignee} disabled={pending||stale} maxLength={100} placeholder="Name or agent" onChange={e=>setAssignee(e.target.value)} className="min-h-11 text-sm md:min-h-9"/>
   </Label>:null}
  {action==="DUPLICATE"?<Label stack className="min-w-0 w-full">Duplicate of finding ID
   <Input value={duplicateOf} list="finding-duplicate-candidates" disabled={pending||stale}
    onChange={e=>setDuplicateOf(e.target.value)}
    placeholder="Select a matching finding"
    className="min-h-11 text-sm md:min-h-9"/>
   <datalist id="finding-duplicate-candidates">{candidates.map(item=><option key={item.id}
     value={item.externalId}>{item.title}</option>)}</datalist>
   </Label>:null}
  {action==="FIX_COMMIT"?<div className="grid min-w-0 gap-3 md:col-span-2 md:grid-cols-2">
   <Label stack className="min-w-0 w-full">Repository
    <Select value={repo} disabled={pending||stale} onChange={e=>setRepo(e.target.value as (typeof FINDING_COMMIT_REPOS)[number])} className="min-h-11 text-sm md:min-h-9">
     {FINDING_COMMIT_REPOS.map(value=><option key={value} value={value}>{value}</option>)}
    </Select></Label>
   <Label stack className="min-w-0 w-full">Commit SHA
    <Input value={sha} disabled={pending||stale} maxLength={40} onChange={e=>setSha(e.target.value)} className="min-h-11 text-sm md:min-h-9"/></Label>
   </div>:null}
  {(action==="COMMENT"||action==="STATUS")?<Label stack className="min-w-0 w-full md:col-span-2">{action==="COMMENT"?"Comment":"Note or reason"}
    <Textarea rows={2} maxLength={4000} value={note} disabled={pending||stale} placeholder={action==="COMMENT"?"Add to the history":"Say why"} onChange={e=>setNote(e.target.value)} className="min-h-11 text-sm md:min-h-9"/>
   </Label>:null}
  </div>
  <div className="flex min-w-0 flex-col gap-2 md:items-end">
  <Button variant="primary" type="button" aria-haspopup="dialog" onClick={()=>void submit()} loading={pending} className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||stale||(action==="ASSIGNEE"&&assignee.trim()===(currentAssignee??""))||(action==="SEVERITY"&&nextSeverity===severity)||(action==="STATUS"&&nextStatus===status)}>{pending?"Saving…":submitLabel}</Button>
  {error&&!confirmOpen?<p role="alert" className="min-w-0 break-words [overflow-wrap:anywhere] text-sm text-error">{error}</p>:null}
  {stale?<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center" role="status">
   <p className="text-sm text-muted-foreground">Editing is paused until the latest finding version loads.</p>
   <Button type="button" variant="secondary" className="min-h-11 sm:ml-auto md:min-h-9" onClick={()=>router.refresh()}>Refresh finding</Button>
  </div>:null}
  </div>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
    title={"Confirm "+submitLabel.toLowerCase()}
    description={"Finding "+externalId+" · Expected version "+version+". The action creates a permanent audit event."}
    confirmLabel={submitLabel} confirmVariant="primary" pending={pending} confirmDisabled={stale}
    onConfirm={()=>void submit(true)}>
    {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </section>;
}
