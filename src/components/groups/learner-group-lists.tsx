"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import type {LearnerGroupListItem} from "@/modules/groups/learner-group-list-service";

export function LearnerGroupLists({mine,open}:{mine:LearnerGroupListItem[];open:LearnerGroupListItem[]}){
 const router=useRouter();
 const [states,setStates]=useState<Record<string,string|null>>({});
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const stateOf=(group:LearnerGroupListItem)=>Object.hasOwn(states,group.id)?states[group.id]:group.memberState;
 async function change(group:LearnerGroupListItem,action:"JOIN"|"LEAVE"){
  if(busy)return;setBusy(group.id);setError(null);
  try{
   const response=await fetch("/api/learn/groups/"+encodeURIComponent(group.id)+"/membership",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
    body:JSON.stringify({action}),
   });
   if(!response.ok)throw Error("Could not "+(action==="JOIN"?"join":"leave")+" this group. Refresh and try again.");
   const result:unknown=await response.json();
   if(!result||typeof result!=="object"||!("group" in result)||
     !result.group||typeof result.group!=="object"||
     !("id" in result.group)||result.group.id!==group.id||
     !("memberState" in result.group))
     throw Error("Group change could not be confirmed.");
   const membership=(result.group as {memberState:unknown}).memberState;
   if(membership!==null&&membership!=="ACTIVE"&&membership!=="WAITLISTED"&&membership!=="REQUESTED")
    throw Error("Unexpected group membership state.");
   setStates(previous=>({...previous,[group.id]:membership}));
   router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not update the group.");}
  finally{setBusy(null);}
 }
 const render=(group:LearnerGroupListItem)=>(
  <li key={group.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border py-3">
   <div className="min-w-0"><p className="font-semibold text-foreground">{group.name}</p>
    <p className="text-xs text-body">{group.kind.replaceAll("_"," ")}</p>
    <div className="mt-1 flex flex-wrap items-center gap-2" aria-label={`${group.name} membership and availability`}>
      <Badge>{stateOf(group)==="ACTIVE"?"Joined":stateOf(group)==="WAITLISTED"?"Waitlisted":stateOf(group)==="REQUESTED"?"Request pending":group.joinOpen?"Open to join":"Locked"}</Badge>
      {group.capacity!==null ? <Badge>{Math.max(0,group.capacity-group.activeCount)} seats left</Badge> : <Badge>No seat limit</Badge>}
      {!group.joinOpen ? <Badge>Locked</Badge> : null}
    </div>
    {group.description?<p className="mt-1 max-w-prose break-words text-sm text-body">{group.description}</p>:null}
   </div>
   {stateOf(group)!==null?<Button variant="secondary" disabled={busy!==null}
      aria-label={`Leave ${group.name}`} onClick={()=>void change(group,"LEAVE")}>Leave group</Button>:
     group.joinOpen?<Button disabled={busy!==null} aria-label={`Join ${group.name}`} onClick={()=>void change(group,"JOIN")}>Join group</Button>:null}
  </li>);
 return <div className="min-w-0 space-y-6">
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <section aria-label="My groups"><h2 className="text-lg font-semibold">Mine</h2>
   {mine.some(row=>stateOf(row)!==null)?<ul className="mt-2 border-t border-border">{mine.filter(row=>stateOf(row)!==null).map(render)}</ul>:
    <div className="mt-2 space-y-2"><p className="text-sm text-body">You have not joined any groups.</p><a href="#browse-open-groups" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-2">Browse groups</a></div>}
  </section>
  <section id="browse-open-groups" aria-label="Open groups"><h2 className="text-lg font-semibold">Open groups</h2>
   {open.length?<ul className="mt-2 border-t border-border">{open.map(render)}</ul>:
    <p className="mt-2 text-sm text-body">No groups are open for joining right now.</p>}
  </section>
 </div>;
}
