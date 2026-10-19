"use client";
import {Radio} from "@/components/ui/radio";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {TpoCustomJobTypeRename} from "./tpo-custom-job-type-rename";
import {TpoCustomJobTypePlaced} from "./tpo-custom-job-type-placed";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {filterTpoJobTypes,tpoJobTypesEmptyMessage,type TpoJobTypeStatusFilter} from "@/modules/placements/tpo-job-type-filter-model";
type JobType={id:string;label:string;active:boolean;updatedAt:string;countsAsPlaced:boolean|null;isBuiltin:boolean};
export function TpoJobTypesEditor({types}:{types:readonly JobType[]}){
 const router=useRouter(),[label,setLabel]=useState("");
 const [countsAsPlaced,setCountsAsPlaced]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [search,setSearch]=useState(""),[status,setStatus]=useState<TpoJobTypeStatusFilter>("ALL");
 const visible=filterTpoJobTypes(types,search,status);

 const atLimit=types.length>=30;
 async function send(url:string,method:"POST"|"PATCH",payload:Record<string,unknown>){
  setBusy(true);setError("");setMessage("");
  try{
   await apiFetch(url,{method,credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   setMessage("Job types saved");router.refresh();
   if(method==="POST"){setLabel("");setCountsAsPlaced(null);}
  }catch(e){
   const code=e instanceof FriendlyFetchError?e.code:null;
   setError(code==="TPO_JOB_TYPE_LAST_ACTIVE"?"Keep at least one job type visible.":
    code==="TPO_JOB_TYPE_LIMIT"?"You can add up to 30 custom job types.":
    code==="TPO_JOB_TYPE_EXISTS"?"This job type already exists.":
    code==="TPO_JOB_TYPE_BUILTIN"?"This is a fixed job type.":
    code==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
    e instanceof Error?e.message:"Job types were not saved.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4 border-t border-border pt-4">
  <h3 className="font-semibold">Manage job types</h3>
  <form className="flex flex-wrap items-end gap-2" onSubmit={event=>{
   event.preventDefault();if(label.trim().length<2||countsAsPlaced===null||atLimit||busy)return;
   void send("/api/placements/tpo/settings/job-types","POST",{label:label.trim(),countsAsPlaced});
  }}>
   <label className="min-w-0 flex-1 text-sm">New job type
    <Input className="mt-1 min-h-11 sm:min-h-9 w-full"
     maxLength={40} minLength={2} value={label} disabled={busy} onChange={event=>setLabel(event.target.value)}/>
   </label>
   <fieldset className="space-x-3 text-sm"><legend>Does an offer of this type count as placed?</legend>
    <label><Radio name="placed" checked={countsAsPlaced===true} onChange={()=>setCountsAsPlaced(true)}/> Yes</label>
    <label><Radio name="placed" checked={countsAsPlaced===false} onChange={()=>setCountsAsPlaced(false)}/> No</label>
   </fieldset>
   <Button type="submit" disabled={label.trim().length<2||countsAsPlaced===null||atLimit||busy} className="min-h-11 sm:min-h-9">Add job type</Button>
  </form>
  <p className="text-sm text-muted-foreground">Custom job types are college-local configuration only; drive forms and reports use their own registered employment types until the integration is completed.</p>
  <p className="text-sm text-muted-foreground">2-40 letters, digits or simple punctuation · {types.length} of 30 custom types</p>
  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Find job type
      <Input type="search" value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}
        className="min-h-11 sm:min-h-9 w-full"
        placeholder="Filter by name"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Status
      <Select value={status} onChange={event=>setStatus(event.target.value as TpoJobTypeStatusFilter)}
        className="min-h-11 sm:min-h-9">
        <option value="ALL">All types</option><option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </Select>
    </label>
  </div>
  <p role="status" className="text-xs text-muted-foreground">{visible.length} of {types.length} custom job types</p>
  {visible.length===0?<p role="status" className="text-sm text-muted-foreground">{tpoJobTypesEmptyMessage(types.length,search,status)}</p>:
   <ul className="space-y-2">{visible.map(item=><li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border py-3">
    <div className="min-w-0 space-y-2"><span className="block break-words text-sm"><strong>{item.label}</strong> · {item.active?"Active":"Inactive"}</span>
     <TpoCustomJobTypeRename id={item.id} label={item.label} version={item.updatedAt}/>
     <TpoCustomJobTypePlaced id={item.id} label={item.label} version={item.updatedAt} value={item.countsAsPlaced}/>
    </div>
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>void send("/api/placements/tpo/settings/job-types/"+item.id,"PATCH",{
      active:!item.active,expectedVersion:item.updatedAt,
    })} className="min-h-11 sm:min-h-9">
      {item.active?"Switch off":"Reactivate"}
    </Button></li>)}</ul>}
  {error?<InlineNotice tone="error" message={error} onDismiss={()=>setError("")}/>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
