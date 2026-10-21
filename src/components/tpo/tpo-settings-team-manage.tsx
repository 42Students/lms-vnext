"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {InlineNotice} from "@/components/ui/inline-notice";

type Candidate={membershipId:string;displayName:string;hasTpoRole:boolean};
const endpoint="/api/placements/tpo/settings/team";
async function send(method:"POST"|"DELETE",membershipId:string){
 const response=await fetch(endpoint,{method,credentials:"same-origin",
  headers:{"content-type":"application/json"},body:JSON.stringify({membershipId})});
 if(!response.ok)throw new Error(response.status===403?"You no longer have permission to manage this team.":
  response.status===503?"Team assignments are temporarily unavailable.":
  "Could not change the placement team. Check ownership and retry.");
}

export function TpoSettingsTeamManage({candidates,activeIds,available}:{
 candidates:Candidate[];activeIds:string[];available:boolean;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[query,setQuery]=useState("");
 const [selected,setSelected]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const active=new Set(activeIds);
 const choices=useMemo(()=>candidates.filter(candidate=>!active.has(candidate.membershipId)&&
  candidate.displayName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
  [candidates,activeIds,query]);
 async function add(){
  if(!selected||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{await send("POST",selected);setOpen(false);setQuery("");setSelected("");
   setSuccess("Added to the team");router.refresh();}
  catch(reason){setError(reason instanceof Error?reason.message:"Could not add team member");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 border-b border-border pb-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-base font-semibold text-[var(--lms-heading)]">Manage placement team</h2>
    <p className="text-sm text-muted-foreground">Add an active faculty member or assign a TPO admin to this college’s placement team.</p></div>
   <Button type="button" disabled={!available} onClick={()=>{setOpen(true);setError("");}}>
    Add a team member
   </Button>
  </div>
  {!available?<InlineNotice tone="warning" message="Faculty team assignments are unavailable. Adding and removing team members is disabled until the table is registered."/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
  {open?<div role="dialog" aria-modal="true" aria-label="Add a team member"
    className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4">
   <h3 className="text-base font-semibold">Add a team member</h3>
   <label className="block text-sm font-semibold" htmlFor="tpo-faculty-search">Faculty member</label>
   <Input id="tpo-faculty-search" value={query} disabled={busy} onChange={event=>{setQuery(event.target.value);setSelected("");}}
    placeholder="Search by name"/>
   <div className="max-h-48 space-y-1 overflow-y-auto" role="listbox" aria-label="Available faculty members">
    {choices.map(person=><button key={person.membershipId} type="button" role="option"
     aria-selected={selected===person.membershipId} disabled={busy}
     onClick={()=>setSelected(person.membershipId)}
     className={"flex min-h-11 w-full items-center rounded-[var(--lms-control-radius)] px-3 text-left text-sm hover:bg-[var(--lms-primary-subtle)] "+(selected===person.membershipId?"bg-[var(--lms-primary-subtle)] font-semibold":"")}>
      {person.displayName} · {person.hasTpoRole?"TPO Admin":"Faculty Coordinator"}
     </button>)}
    {choices.length===0?<p className="px-3 py-3 text-sm text-muted-foreground">No available faculty members match this search.</p>:null}
   </div>
   <p className="text-xs text-muted-foreground">New members can access placement team work according to their existing college role and scoped permissions.</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
   <div className="flex flex-wrap justify-end gap-2">
    <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
    <Button type="button" disabled={busy||!selected} onClick={()=>void add()}>{busy?"Adding…":"Add"}</Button>
   </div>
  </div>:null}
 </section>;
}
export function TpoSettingsTeamRemove({membershipId,displayName,removable,isSelf,permanentRole}:{
 membershipId:string;displayName:string;removable:boolean;isSelf:boolean;permanentRole:boolean;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 async function remove(){
  setBusy(true);setError("");
  try{await send("DELETE",membershipId);setOpen(false);setSuccess("Removed from the team");
   router.refresh();}
  catch(reason){setError(reason instanceof Error?reason.message:"Could not remove team member");}
  finally{setBusy(false);}
 }
 if(!removable||isSelf)return <span className="text-xs text-muted-foreground">{isSelf?"Your membership":"Managed by college"}</span>;
 return <div className="min-w-0 space-y-2">
  <Button type="button" size="sm" variant="secondary" onClick={()=>{setOpen(true);setError("");}}>Remove member</Button>
  {success?<p className="text-xs text-[var(--lms-primary-text)]" role="status">{success}</p>:null}
  {open?<div role="dialog" aria-modal="true" aria-label={"Remove "+displayName}
    className="min-w-[240px] max-w-sm space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 shadow-lg">
   <h3 className="font-semibold">Remove {displayName} from the placement team?</h3>
   <p className="text-sm">They lose placement team assignment access at once, private conversations included. What they wrote stays, marked “left the team”.</p>
   {permanentRole?<p className="text-xs text-muted-foreground">Their permanent TPO or College Admin membership is not removed.</p>:null}
   <p className="text-xs text-muted-foreground">Reassign any active drives and recruiter relationships before removing their team assignment.</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
   <div className="flex flex-wrap gap-2">
    <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
    <Button type="button" size="sm" disabled={busy} onClick={()=>void remove()}>
     {busy?"Removing…":"Remove"}</Button>
   </div>
  </div>:null}
 </div>;
}
