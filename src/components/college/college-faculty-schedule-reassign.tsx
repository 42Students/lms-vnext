"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Faculty={id:string;name:string|null};
type Receipt={total:number;reassigned:number;skipped:number;
 results:{id:string;title:string;status:"REASSIGNED"|"SKIPPED";reason:string}[]};
export function CollegeFacultyScheduleReassign({membershipId,name}:{
 membershipId:string;name:string;
}){
 const router=useRouter(),[open,setOpen]=useState(false),
 [busy,setBusy]=useState(false),[options,setOptions]=useState<Faculty[]>([]),
 [selected,setSelected]=useState(""),[upcoming,setUpcoming]=useState(0),
 [error,setError]=useState(""),[receipt,setReceipt]=useState<Receipt|null>(null);
 const {ask,confirmation}=useCollegeConfirmation();
 const base="/api/college/faculty/"+encodeURIComponent(membershipId)+"/reassign-schedules";
 async function show(){
  setOpen(true);setBusy(true);setError("");setReceipt(null);
  try{const response=await fetch(base,{cache:"no-store"});
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw Error(body?.error??"Could not read faculty schedules");
   setOptions(body.faculty??[]);setUpcoming(body.upcoming??0);
   if(body.truncated)setError("More than 200 upcoming sessions; this bulk action cannot safely move all of them.");
  }catch(e){setError(e instanceof Error?e.message:"Could not load schedules");}
  finally{setBusy(false);}
 }
 async function submit(){
  if(!selected||busy)return;
  if(!(await ask("Reassign upcoming class schedules for "+name+"? Sessions with clashes are skipped.")))return;
  setBusy(true);setError("");
  try{const response=await fetch(base,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({replacementMembershipId:selected,confirmed:true})});
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw Error(body?.error??"Reassignment failed");
   setReceipt(body as Receipt);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Reassignment failed");}
  finally{setBusy(false);}
 }
 return <>{confirmation}
  <Button variant="secondary" type="button" onClick={()=>void show()} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-4 text-sm font-semibold text-primary-text">
   Reassign class schedules</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)setOpen(false);}} title="Reassign class schedules" dismissible={!busy}>
    <div className="flex justify-between gap-3"><h2 className="font-semibold">Reassign class schedules</h2>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}
      className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3">Close</Button></div>
    <p className="text-sm">{upcoming} upcoming scheduled session(s) for {name}.</p>
    <label className="grid gap-2 text-sm font-semibold">Assign to
     <Select value={selected} onChange={e=>setSelected(e.target.value)}
      className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-base sm:text-sm">
      <option value="">Choose a replacement faculty</option>
      {options.map(row=><option key={row.id} value={row.id}>{row.name??row.id}</option>)}
     </Select></label>
    <p className="text-xs text-muted-foreground">Only future scheduled sessions are changed. Overlapping sessions are skipped; existing teaching history is retained.</p>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <Button variant="primary" type="button" disabled={busy||!selected||!upcoming} onClick={()=>void submit()}
     className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
     {busy?"Reassigning…":"Reassign class schedules"}</Button>
    {receipt?<section role="status" className="space-y-2">
     <p className="font-semibold">Reassigned {receipt.reassigned} of {receipt.total} upcoming session(s).</p>
     <p>{receipt.skipped} skipped.</p>
     <ul className="space-y-1 text-sm">
      {receipt.results.filter(row=>row.status==="SKIPPED").map(row=><li key={row.id}>
       {row.title}: {row.reason}</li>)}
     </ul>
    </section>:null}
  </Dialog>
 </>;
}
