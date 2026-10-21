"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
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
    <p className="text-xs text-body">{group.kind.replaceAll("_"," ")} · {stateOf(group)??"Open to join"}</p>
    {group.description?<p className="mt-1 max-w-prose break-words text-sm text-body">{group.description}</p>:null}
   </div>
   {stateOf(group)!==null?<Button variant="secondary" disabled={busy!==null}
      onClick={()=>void change(group,"LEAVE")}>Leave group</Button>:
     group.joinOpen?<Button disabled={busy!==null} onClick={()=>void change(group,"JOIN")}>Join group</Button>:null}
  </li>);
 return <div className="min-w-0 space-y-6">
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <section aria-label="My groups"><h2 className="text-lg font-semibold">Mine</h2>
   {mine.some(row=>stateOf(row)!==null)?<ul className="mt-2 border-t border-border">{mine.filter(row=>stateOf(row)!==null).map(render)}</ul>:
    <p className="mt-2 text-sm text-body">You have not joined any groups.</p>}
  </section>
  <section aria-label="Open groups"><h2 className="text-lg font-semibold">Open groups</h2>
   {open.length?<ul className="mt-2 border-t border-border">{open.map(render)}</ul>:
    <p className="mt-2 text-sm text-body">No groups are open for joining right now.</p>}
  </section>
 </div>;
}
