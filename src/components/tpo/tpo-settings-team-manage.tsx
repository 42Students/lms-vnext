"use client";
import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Dialog} from "@/components/ui/dialog";
import {apiFetch} from "@/lib/api-fetch";

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
  {!available?<InlineNotice tone="info" message="Faculty team assignments are unavailable. Adding and removing team members is disabled until the table is registered."/>:null}
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
type RemovalImpact={drives:number;companies:number;recruiterLeads:number;followups:number};
export function TpoSettingsTeamRemove({membershipId,displayName,removable,isSelf,permanentRole}:{
 membershipId:string;displayName:string;removable:boolean;isSelf:boolean;permanentRole:boolean;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [checking,setChecking]=useState(false);
 const [impact,setImpact]=useState<RemovalImpact|null>(null);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const removalLock=useRef(false);
 const ownedWork=(impact?.drives??0)+(impact?.companies??0)+
  (impact?.recruiterLeads??0)+(impact?.followups??0);
 async function reviewRemoval(){
  if(checking||busy)return;
  setChecking(true);setImpact(null);setError("");
  try{
   const receipt=await apiFetch<{impact:RemovalImpact}>(
    endpoint+"?"+new URLSearchParams({membershipId}).toString(),{cache:"no-store"});
   const next=receipt.impact;
   if(!next||!["drives","companies","recruiterLeads","followups"].every(key=>
     Object.prototype.hasOwnProperty.call(next,key))||
     !Object.values(next).every(value=>Number.isSafeInteger(value)&&value>=0))
    throw new Error("Invalid impact receipt");
   setImpact(next);setOpen(true);
  }catch{
   setError("Could not verify what this team member owns. Retry before removing them.");
  }finally{setChecking(false);}
 }
 async function remove(){
  if(removalLock.current||checking||!impact||ownedWork>0)return;
  removalLock.current=true;
  setBusy(true);setError("");
  try{await send("DELETE",membershipId);setOpen(false);setSuccess("Removed from the team");
   router.refresh();}
  catch(reason){setError(reason instanceof Error?reason.message:"Could not remove team member");}
  finally{removalLock.current=false;setBusy(false);}
 }
 if(!removable||isSelf)return <span className="text-xs text-muted-foreground">{isSelf?"Your membership":"Managed by college"}</span>;
 return <div className="min-w-0 space-y-2">
  <Button type="button" size="sm" variant="secondary" disabled={checking||busy}
   onClick={()=>void reviewRemoval()}>{checking?"Checking ownership…":"Hand over and remove"}</Button>
  {success?<p className="text-xs text-[var(--lms-primary-text)]" role="status">{success}</p>:null}
  {error&&!open?<InlineNotice tone="error" message={error}/>:null}
  <Dialog open={open} role="alertdialog" title={"Remove "+displayName+" from the placement team?"}
   description="They lose placement team assignment access at once, including private conversations. What they wrote stays, marked “left the team”."
   className="max-w-sm" dismissible={!busy} onOpenChange={next=>{if(!busy)setOpen(next);}}
   footer={<div className="flex w-full flex-wrap justify-end gap-2">
    <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button>
    <Button type="button" size="sm" variant="danger" loading={busy}
     disabled={busy||checking||!impact||ownedWork>0} onClick={()=>void remove()}>
     {busy?"Removing…":"Remove"}</Button>
   </div>}>
   {permanentRole?<p className="text-xs text-muted-foreground">Their permanent TPO or College Admin membership is not removed.</p>:null}
   {impact?<p role="status" className="text-sm">
    Owned work: {impact.drives} live drives, {impact.companies} companies,
    {impact.recruiterLeads} recruiter leads and {impact.followups} follow-ups.
   </p>:null}
   {ownedWork>0?<InlineNotice tone="info"
    message="Hand over this member’s work to another active placement team member before removing them. Then choose Hand over and remove again to recheck ownership."/>:
    <p className="text-sm">No owned work remains. Confirm to remove this team assignment; existing messages remain recorded.</p>}
   {error?<InlineNotice tone="error" message={error}/>:null}
  </Dialog>
 </div>;
}
