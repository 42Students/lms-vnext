"use client";
import {TpoCustomJobTypeRename} from "./tpo-custom-job-type-rename";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {filterTpoJobTypes,tpoJobTypesEmptyMessage,type TpoJobTypeStatusFilter} from "@/modules/placements/tpo-job-type-filter-model";
type JobType={id:string;label:string;active:boolean;updatedAt:string};
export function TpoJobTypesEditor({types}:{types:readonly JobType[]}){
 const router=useRouter(),[label,setLabel]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [search,setSearch]=useState(""),[status,setStatus]=useState<TpoJobTypeStatusFilter>("ALL");
 const visible=filterTpoJobTypes(types,search,status);
 const activeCount=types.filter(item=>item.active).length;
 const atLimit=types.length>=30;
 async function send(url:string,method:"POST"|"PATCH",payload:Record<string,unknown>){
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch(url,{method,credentials:"same-origin",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(
    data.error==="TPO_JOB_TYPE_LAST_ACTIVE"?"Keep at least one job type visible.":
    data.error==="TPO_JOB_TYPE_LIMIT"?"You can add up to 30 custom job types.":
    data.error==="TPO_JOB_TYPE_EXISTS"?"This job type already exists.":
    data.error==="TPO_JOB_TYPE_BUILTIN"?"This is a fixed job type.":
    data.error==="TPO_SETTINGS_STALE"?"Settings changed. Refresh before retrying.":
    data.error??"Job types were not saved."
   );
   setMessage("Job types saved");router.refresh();
   if(method==="POST")setLabel("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to save setting.");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">Manage job types</h3>
  <form className="flex flex-wrap items-end gap-2" onSubmit={event=>{
   event.preventDefault();if(label.trim().length<2||atLimit||busy)return;
   void send("/api/placements/tpo/settings/job-types","POST",{label:label.trim()});
  }}>
   <label className="min-w-0 flex-1 text-sm">New job type
    <input className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"
     maxLength={40} minLength={2} value={label} disabled={busy} onChange={event=>setLabel(event.target.value)}/>
   </label>
   <button type="submit" disabled={label.trim().length<2||atLimit||busy} className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary disabled:opacity-50">Add job type</button>
  </form>
  <p className="text-sm text-muted-foreground">Custom job types are college-local configuration only; drive forms and reports use their own registered employment types until the integration is completed.</p>
  <p className="text-sm text-muted-foreground">2-40 letters, digits or simple punctuation · {types.length} of 30 custom types</p>
  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Find job type
      <input type="search" value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}
        className="min-h-11 w-full rounded border border-border bg-surface px-3"
        placeholder="Filter by name"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Status
      <select value={status} onChange={event=>setStatus(event.target.value as TpoJobTypeStatusFilter)}
        className="min-h-11 rounded border border-border bg-surface px-3">
        <option value="ALL">All types</option><option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </label>
  </div>
  <p role="status" className="text-xs text-muted-foreground">{visible.length} of {types.length} custom job types</p>
  {visible.length===0?<p role="status" className="text-sm text-muted-foreground">{tpoJobTypesEmptyMessage(types.length,search,status)}</p>:
   <ul className="space-y-2">{visible.map(item=><li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded border border-border p-3">
    <div className="min-w-0 space-y-2"><span className="block break-words text-sm"><strong>{item.label}</strong> · {item.active?"Active":"Inactive"}</span>
     <TpoCustomJobTypeRename id={item.id} label={item.label} version={item.updatedAt}/>
    </div>
    <button type="button" disabled={busy||(item.active&&activeCount<=1)} title={item.active&&activeCount<=1?"Keep at least one job type visible.":undefined} onClick={()=>void send("/api/placements/tpo/settings/job-types/"+item.id,"PATCH",{
      active:!item.active,expectedVersion:item.updatedAt,
    })} className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">
      {item.active?"Switch off":"Reactivate"}
    </button></li>)}</ul>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
