"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
type Member={membershipId:string;displayName:string};
export function TpoTeamHandover({sourceMembershipId,sourceName,members}:{
 sourceMembershipId:string;sourceName:string;members:Member[];
}){
 const router=useRouter(),pending=useRef(false);
 const [target,setTarget]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const successor=members.find(member=>member.membershipId===target);
 async function handover(){
  if(pending.current||!successor||sourceMembershipId===target)return;
  if(!window.confirm("Hand over "+sourceName+"'s placement work to "+successor.displayName+
   "? Drives, companies, recruiter leads and follow-ups will be reassigned. "+
   "This does not remove team access or transfer private asks."))return;
  pending.current=true;setBusy(true);setError("");setMessage("");
  try{
   const result=await apiFetch<{counts:{drives:number;companies:number;recruiterLeads:number;followups:number};roleRevoked:false}>(
    "/api/placements/tpo/team/handover",{
     method:"POST",credentials:"same-origin",timeoutMs:12000,
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({sourceMembershipId,targetMembershipId:target}),
    });
   setMessage("Work handed over: "+result.counts.drives+" drives, "+
    result.counts.companies+" companies, "+result.counts.recruiterLeads+
    " recruiter leads, "+result.counts.followups+" follow-ups. Team access is unchanged.");
   setTarget("");router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not hand over work. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <section aria-label={"Hand over "+sourceName+"'s placement work"} className="mt-3 space-y-2">
  <label className="grid gap-1 text-sm text-body">Who takes over?
   <Select value={target} onChange={event=>setTarget(event.target.value)} disabled={busy}
    className="min-h-11 sm:min-h-9">
    <option value="">Choose an active placement team member</option>
    {members.filter(member=>member.membershipId!==sourceMembershipId).map(member=>
     <option key={member.membershipId} value={member.membershipId}>{member.displayName}</option>)}
   </Select>
  </label>
  <Button type="button" variant="secondary" disabled={!target||busy} onClick={()=>void handover()}
   className="min-h-11 sm:min-h-9">
   {busy?"Handing over…":"Hand over work"}
  </Button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </section>;
}
