"use client";
import {Radio} from "@/components/ui/radio";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {TpoCustomJobTypeRename} from "./tpo-custom-job-type-rename";
import {TpoCustomJobTypePlaced} from "./tpo-custom-job-type-placed";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {useState} from "react";
import {filterTpoJobTypes,tpoJobTypesEmptyMessage,type TpoJobTypeStatusFilter} from "@/modules/placements/tpo-job-type-filter-model";
type JobType={id:string;label:string;active:boolean;updatedAt:string;countsAsPlaced:boolean|null;isBuiltin:boolean;drives?:number};
export function TpoJobTypesEditor({types}:{types:readonly JobType[]}){
 const router=useRouter(),[label,setLabel]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();
 const [countsAsPlaced,setCountsAsPlaced]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [retryAction,setRetryAction]=useState<{url:string;method:"POST"|"PATCH"|"DELETE";payload:Record<string,unknown>}|null>(null);
 const [search,setSearch]=useState(""),[status,setStatus]=useState<TpoJobTypeStatusFilter>("ALL");
 const visible=filterTpoJobTypes(types,search,status);

 const atLimit=types.length>=30;
 const normalizedLabel=label.trim().replace(/\s+/g," ");
 const validLabel=/^[\p{L}\p{N} +&\/().,'-]{2,40}$/u.test(normalizedLabel);
 const nameProblem=normalizedLabel && !validLabel?"2-40 letters, digits or simple punctuation":
  types.some(item=>item.label.toLowerCase()===normalizedLabel.toLowerCase())?
    '"'+normalizedLabel+'" is already a job type':"";
 async function send(url:string,method:"POST"|"PATCH"|"DELETE",payload:Record<string,unknown>){
  setBusy(true);setError("");setMessage("");setRetryAction(null);
  try{
   await apiFetch(url,{method,credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   setMessage("Job types saved");router.refresh();
   if(method==="POST"){setLabel("");setCountsAsPlaced(null);}
  }catch(e){
   const code=e instanceof FriendlyFetchError?e.code:null;
   const attemptedName=typeof payload.label==="string"?payload.label:normalizedLabel;
   setError(code==="TPO_JOB_TYPE_LAST_ACTIVE"?"Keep at least one job type switched on":
    code==="TPO_JOB_TYPE_LIMIT"?"Up to 30 job types of your own":
    code==="TPO_JOB_TYPE_EXISTS"?'"'+attemptedName+'" is already a job type':
    code==="TPO_JOB_TYPE_INVALID_LIST"?"Send the list of job types":
    code==="TPO_JOB_TYPE_IN_USE"?"Used by drives: switch it off instead":
    code==="TPO_JOB_TYPE_BUILTIN"?"This is a fixed job type.":
    code==="TPO_SETTINGS_PENDING"?"Job types are temporarily unavailable. Please retry.":
    code==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
    "Job types were not saved.");
   setRetryAction({url,method,payload});}
  finally{setBusy(false);}
 }
 async function remove(item:JobType){
  if(busy || (item.drives??0)>0)return;
  const approved=await askConfirm('Remove "'+item.label+'"? This cannot be undone.');
  if(!approved)return;
  await send("/api/placements/tpo/settings/job-types/"+item.id,"DELETE",{expectedVersion:item.updatedAt});
 }
 return <section className="min-w-0 space-y-4 border-t border-border pt-4">
  {dialog}
  <h3 className="font-semibold">Manage job types</h3>
  <form className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] min-[768px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={event=>{
   event.preventDefault();if(!validLabel||nameProblem||countsAsPlaced===null||atLimit||busy)return;
   void send("/api/placements/tpo/settings/job-types","POST",{label:normalizedLabel,countsAsPlaced});
  }}>
   <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New job type
    <Input className="min-h-11 w-full min-[768px]:min-h-9"
     maxLength={40} minLength={2} value={label} disabled={busy} aria-invalid={Boolean(nameProblem)}
     onChange={event=>setLabel(event.target.value)}/>
    {nameProblem?<span role="alert" className="text-xs text-[var(--lms-error)]">{nameProblem}</span>:null}
   </label>
   <fieldset className="min-w-0 space-y-[var(--lms-space-2)] text-sm"><legend>Does an offer of this type count as placed?</legend>
    <label><Radio name="placed" disabled={busy} checked={countsAsPlaced===true} onChange={()=>setCountsAsPlaced(true)}/> Yes</label>
    <label><Radio name="placed" disabled={busy} checked={countsAsPlaced===false} onChange={()=>setCountsAsPlaced(false)}/> No</label>
   </fieldset>
   <Button type="submit" disabled={!validLabel||Boolean(nameProblem)||countsAsPlaced===null||atLimit||busy} className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">Add job type</Button>
  </form>
  <p className="text-sm text-muted-foreground leading-[22px]">The drive form, filters and reports use this list. Switching a type off hides it from new drives; drives that already have it keep it.</p>
  <nav aria-label="Job-type usage" className="flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-xs">
   <Link href="/tpo/placements/new" className="font-semibold text-link underline">Create a drive</Link>
   <Link href="/tpo/placements/lifecycle" className="font-semibold text-link underline">Filter drives by job type</Link>
   <Link href="/tpo/reports/placement-summary" className="font-semibold text-link underline">Placement-count report</Link>
  </nav>
  <p className="text-sm text-muted-foreground leading-[22px]">2-40 letters, digits or simple punctuation · {types.length} of 30 custom types</p>
  <div className="grid gap-3 min-[768px]:grid-cols-[minmax(0,1fr)_auto]">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Find job type
      <Input type="search" value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}
        className="min-h-11 min-[768px]:min-h-9 w-full"
        placeholder="Filter by name"/>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Status
      <Select value={status} onChange={event=>setStatus(event.target.value as TpoJobTypeStatusFilter)}
        className="min-h-11 min-[768px]:min-h-9">
        <option value="ALL">All types</option><option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </Select>
    </label>
  </div>
  <p role="status" className="text-xs text-muted-foreground leading-[20px]">{visible.length} of {types.length} custom job types</p>
  {visible.length===0?<EmptyState title={tpoJobTypesEmptyMessage(types.length,search,status)}/>:
   <ul className="space-y-2">{visible.map(item=><li key={item.id} className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-3)] min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
    <div className="min-w-0 space-y-2"><span className="block break-words text-sm"><strong>{item.label}</strong> · {item.active?"Active":"Inactive"} · Drives: {item.drives??0}</span>
     <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
       <TpoCustomJobTypeRename id={item.id} label={item.label} version={item.updatedAt}/>
       <TpoCustomJobTypePlaced id={item.id} label={item.label} version={item.updatedAt} value={item.countsAsPlaced}/>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>void send("/api/placements/tpo/settings/job-types/"+item.id,"PATCH",{
        active:!item.active,expectedVersion:item.updatedAt,
      })} className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">
        {item.active?"Switch off":"Reactivate"}
      </Button>
      <Button type="button" variant="secondary" disabled={busy||(item.drives??0)>0}
        title={(item.drives??0)>0?"Used by drives: switch it off instead":"Remove "+item.label}
        onClick={()=>void remove(item)} className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">Remove</Button>
    </div></li>)}</ul>}
  {error?<div className="flex flex-wrap items-center gap-3" role="alert">
    <InlineNotice tone="error" message={"Job types were not saved. "+error} onDismiss={()=>setError("")}/>
    {retryAction?<Button type="button" variant="secondary" disabled={busy}
      onClick={()=>void send(retryAction.url,retryAction.method,retryAction.payload)}>Retry</Button>:null}
  </div>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
 </section>;
}
