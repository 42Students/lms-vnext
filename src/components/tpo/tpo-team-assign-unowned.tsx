"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";

type Member={membershipId:string;displayName:string};
export function TpoTeamAssignUnowned({drives,companies,members}:{
 drives:number;companies:number;members:Member[];
}){
 const router=useRouter(),pending=useRef(false);
 const [assignee,setAssignee]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
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
 return <section aria-label="Assign unowned placement work" className="space-y-3 border-t border-border pt-4">
  <h2 className="font-semibold">Nobody owns {drives} drives and {companies} companies</h2>
  <p className="text-xs text-muted-foreground">Give the unassigned active drives and company relationships to one placement team member. Work with an owner is not moved.</p>
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid min-w-48 flex-1 gap-1 text-sm">Who takes them?
    <Select disabled={busy} value={assignee} onChange={event=>setAssignee(event.target.value)}
     className="min-h-11 sm:min-h-9">
     <option value="">Choose a team member</option>
     {members.map(member=><option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
    </Select>
   </label>
   <Button type="button" disabled={busy||!assignee} onClick={()=>setConfirmOpen(true)}
    className="min-h-11 sm:min-h-9">
    {busy?"Assigning…":"Assign work"}
   </Button>
  </div>
  <ConfirmActionDialog open={confirmOpen&&!busy}
   title="Assign unowned placement work?"
   consequence={"Assign "+drives+" unowned drive(s) and "+companies+" company relationship(s) to "+(members.find(member=>member.membershipId===assignee)?.displayName??"the selected teammate")+"? Work that already has an owner will not move."}
   confirmLabel="Assign work"
   onCancel={()=>setConfirmOpen(false)}
   onConfirm={()=>{setConfirmOpen(false);void assign();}}/>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
