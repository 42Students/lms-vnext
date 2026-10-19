"use client";
import { Button } from "@/components/ui/button";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {DataTable} from "@/components/ui/data-table";
import {apiFetch} from "@/lib/api-fetch";
type Row={applicationId:string;name:string;roleTitle:string;annualCtcInr:number|null;rank:number;
 reasons:string[];canPromote:boolean;promotionStatus:string|null};
type Preview={storageReady:boolean;freeSeats:number|null;activeOffers:number;rows:Row[];next:Row|null;previewToken:string};
export function TpoWaitlistPromotionControl({jobId,preview}:{jobId:string;preview:Preview}){
 const router=useRouter();const inFlight=useRef(false);const [reason,setReason]=useState("A placement offer seat became available");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");const [confirmOpen,setConfirmOpen]=useState(false);
 async function promote(){
  if(!preview.next||inFlight.current||reason.trim().length<3)return;
  inFlight.current=true;
  setBusy(true);setError("");setSuccess("");
  try{const data=await apiFetch<{seatNumber?:number}>("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/waitlist-promote",{
   method:"POST",credentials:"same-origin",timeoutMs:35000,headers:{"content-type":"application/json"},
   body:JSON.stringify({action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:preview.previewToken,reason:reason.trim()}),
  });
  if(typeof data?.seatNumber!=="number"||!Number.isSafeInteger(data.seatNumber)||data.seatNumber<1)
   throw Error("Could not promote waitlisted learner. Refresh the preview before retrying.");
  setSuccess("Offer released to "+preview.next.name+" for seat "+data.seatNumber+".");
  router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not release offer");}
  finally{inFlight.current=false;setBusy(false);setConfirmOpen(false);}
 }
 return <section className="space-y-4">
  <p className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 text-sm">
   {preview.freeSeats===null?"No fixed openings recorded":preview.freeSeats+" available seat(s)"}
   {" · "}{preview.activeOffers} active issued/accepted offers.
  </p>
  {!preview.storageReady?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm">
   Waitlist promotion storage is not registered yet. No promotion can be released.</p>:null}
  <p className="text-sm text-body">{preview.rows.filter(row=>row.canPromote).length} waitlisted learner(s) currently pass preliminary checks; {preview.rows.filter(row=>!row.canPromote).length} have a blocking reason. The next eligible rank is shown below.</p>
  <DataTable<(typeof preview.rows)[number]> caption="Applied waitlist results"
   rows={preview.rows} getRowKey={row=>row.applicationId}
   empty={<p role="status">No applied waitlist results in the final round.</p>}
   columns={[
    {key:"rank",header:"Rank",mobilePriority:"secondary",cell:row=>row.rank},
    {key:"student",header:"Student",mobilePriority:"primary",cell:row=><strong>{row.name}</strong>},
    {key:"role",header:"Role / package",mobilePriority:"secondary",cell:row=>
      row.roleTitle+(row.annualCtcInr===null?"":" · ₹"+row.annualCtcInr/100000+" LPA")},
    {key:"rules",header:"Rules check",mobilePriority:"secondary",cell:row=>
      (row.canPromote?"Ready for final offer checks":row.reasons.join("; "))+
      (row.promotionStatus?" · "+row.promotionStatus:"")},
   ]}/>
  {preview.next&&preview.storageReady?<div className="space-y-3 border-t border-border pt-4">
   <h2 className="font-semibold">Offer to next waitlisted: {preview.next.name} (rank {preview.next.rank})</h2>
   <p className="text-sm text-body">Review the ranked queue before release. The offer issuer rechecks held-offer rules, eligibility and response deadline.</p>
   <label className="grid gap-1 text-sm">Reason for promotion
    <textarea rows={2} minLength={3} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}
     className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3"/></label>
   <Button variant="primary" type="button" disabled={busy||reason.trim().length<3} onClick={()=>setConfirmOpen(true)}
    className="min-h-11 md:min-h-9 px-4">
    {busy?"Verifying…":"Verify and release next offer"}</Button>
  </div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
    title={preview.next?"Verify and release one offer to "+preview.next.name+" (waitlist rank "+preview.next.rank+")?":"Verify and release one offer?"}
    description="This issues a real offer and records the seat."
    confirmLabel="Verify and release next offer" onConfirm={()=>void promote()}/>
  {success?<p role="status">{success}</p>:null}
  <Button variant="secondary" type="button" disabled={busy} onClick={()=>router.refresh()}
    className="min-h-11 md:min-h-9 px-3">Refresh waitlist and seats</Button>
  {error?<p role="alert" className="text-foreground">{error} Refresh the preview before retrying.</p>:null}
 </section>;
}
