"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";

type Member={membershipId:string;displayName:string};
export function TpoTeamAssignUnowned({drives,companies,members}:{
 drives:number;companies:number;members:Member[];
}){
 const router=useRouter(),pending=useRef(false);
 const [assignee,setAssignee]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function assign(){
  if(pending.current||!assignee)return;
  pending.current=true;setBusy(true);setError("");setMessage("");
  try{
   const assigned=await apiFetch<{drives:number;companies:number}>(
    "/api/placements/tpo/team/unowned",{
    method:"POST",credentials:"same-origin",timeoutMs:15000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({targetMembershipId:assignee}),
   });
   setMessage(assigned.drives||assigned.companies?
    "Assigned "+assigned.drives+" drive(s) and "+assigned.companies+" company relationship(s).":
    "Everything already has an owner.");
   router.refresh();
  }catch{
   setError("Could not assign unowned work. Nothing has been assumed saved. Try again.");
  }finally{pending.current=false;setBusy(false);}
 }
 if(!drives&&!companies)return null;
 return <section aria-label="Assign unowned placement work" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Nobody owns {drives} drives and {companies} companies</h2>
  <p className="text-xs text-muted-foreground">Give the unassigned active drives and company relationships to one placement team member. Work with an owner is not moved.</p>
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid min-w-48 flex-1 gap-1 text-sm">Who takes them?
    <select disabled={busy} value={assignee} onChange={event=>setAssignee(event.target.value)}
     className="min-h-11 rounded-md border border-border bg-surface px-3">
     <option value="">Choose a team member</option>
     {members.map(member=><option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
    </select>
   </label>
   <button type="button" disabled={busy||!assignee} onClick={()=>void assign()}
    className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {busy?"Assigning…":"Assign work"}
   </button>
  </div>
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
