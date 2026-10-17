"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Row={applicationId:string;name:string;roleTitle:string;annualCtcInr:number|null;rank:number;
 reasons:string[];canPromote:boolean;promotionStatus:string|null};
type Preview={storageReady:boolean;freeSeats:number|null;activeOffers:number;rows:Row[];next:Row|null;previewToken:string};
export function TpoWaitlistPromotionControl({jobId,preview}:{jobId:string;preview:Preview}){
 const router=useRouter();const [reason,setReason]=useState("A placement offer seat became available");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 async function promote(){
  if(!preview.next||busy||reason.trim().length<3)return;
  if(!window.confirm("Verify and release one offer to "+preview.next.name+" (waitlist rank "+preview.next.rank+")? This issues a real offer and records the seat."))return;
  setBusy(true);setError("");setSuccess("");
  try{const res=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/waitlist-promote",{
   method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:preview.previewToken,reason:reason.trim()}),
  });
  const data=await res.json() as {error?:string;seatNumber?:number};
  if(!res.ok)throw Error(data.error??"Could not promote waitlisted learner");
  setSuccess("Offer released to "+preview.next.name+" for seat "+data.seatNumber+".");
  router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not release offer");}
  finally{setBusy(false);}
 }
 return <section className="space-y-4">
  <p className="rounded border border-border bg-surface p-4 text-sm">
   {preview.freeSeats===null?"No fixed openings recorded":preview.freeSeats+" available seat(s)"}
   {" · "}{preview.activeOffers} active issued/accepted offers.
  </p>
  {!preview.storageReady?<p role="status" className="rounded border border-border p-4 text-sm">
   Waitlist promotion storage is not registered yet. No promotion can be released.</p>:null}
  <p className="text-sm text-body">{preview.rows.filter(row=>row.canPromote).length} waitlisted learner(s) currently pass preliminary checks; {preview.rows.filter(row=>!row.canPromote).length} have a blocking reason. The next eligible rank is shown below.</p>
  <div className="overflow-x-auto rounded border border-border bg-surface"><table className="min-w-full text-left text-sm">
   <thead><tr><th className="p-3">Rank</th><th className="p-3">Student</th><th className="p-3">Role / package</th><th className="p-3">Rules check</th></tr></thead>
   <tbody>{preview.rows.length?preview.rows.map(r=><tr key={r.applicationId} className="border-t border-border">
    <td className="p-3">{r.rank}</td><td className="p-3 font-semibold">{r.name}</td><td className="p-3">{r.roleTitle}
     {r.annualCtcInr===null?"":" · ₹"+(r.annualCtcInr/100000)+" LPA"}</td>
    <td className="p-3">{r.canPromote?"Ready for final offer checks":r.reasons.join("; ")}
     {r.promotionStatus?" · "+r.promotionStatus:""}</td>
   </tr>):<tr><td colSpan={4} className="p-4">No applied waitlist results in the final round.</td></tr>}</tbody>
  </table></div>
  {preview.next&&preview.storageReady?<div className="space-y-3 rounded border border-border bg-surface p-5">
   <h2 className="font-semibold">Offer to next waitlisted: {preview.next.name} (rank {preview.next.rank})</h2>
   <p className="text-sm text-body">Review the ranked queue before release. The offer issuer rechecks held-offer rules, eligibility and response deadline.</p>
   <label className="grid gap-1 text-sm">Reason for promotion
    <textarea rows={2} minLength={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}
     className="rounded border border-border bg-surface p-3"/></label>
   <button type="button" disabled={busy||reason.trim().length<3} onClick={()=>void promote()}
    className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    {busy?"Verifying…":"Verify and release next offer"}</button>
  </div>:null}
  {success?<p role="status">{success}</p>:null}
  <button type="button" disabled={busy} onClick={()=>router.refresh()}
    className="min-h-10 rounded border border-border px-3 text-sm font-semibold">Refresh waitlist and seats</button>
  {error?<p role="alert" className="text-error">{error} Refresh the preview before retrying.</p>:null}
 </section>;
}
