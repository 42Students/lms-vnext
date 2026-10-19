"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
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
  <Button variant="secondary" type="button" onClick={()=>void show()} className="min-h-11 md:min-h-9">
   Reassign class schedules</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)setOpen(false);}} title="Reassign class schedules" dismissible={!busy}>
    <div className="flex justify-end gap-3">
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}
      className="min-h-11 md:min-h-9">Close</Button></div>
    <p className="text-sm">{upcoming} upcoming scheduled session(s) for {name}.</p>
    <label className="grid gap-2 text-sm font-semibold">Assign to
     <Select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}>
      <option value="">Choose a replacement faculty</option>
      {options.map(row=><option key={row.id} value={row.id}>{row.name??row.id}</option>)}
     </Select></label>
    <p className="text-xs text-muted-foreground">Only future scheduled sessions are changed. Overlapping sessions are skipped; existing teaching history is retained.</p>
    {error?<Alert tone="error">{error}</Alert>:null}
    <Button variant="primary" type="button" disabled={busy||!selected||!upcoming} onClick={()=>void submit()}
     className="min-h-11 md:min-h-9" loading={busy}>
     {busy?"Reassigning…":"Reassign class schedules"}</Button>
    {receipt?<Alert tone="success" className="space-y-2">
     <p className="font-semibold">Reassigned {receipt.reassigned} of {receipt.total} upcoming session(s).</p>
     <p>{receipt.skipped} skipped.</p>
     <ul className="space-y-1 text-sm">
      {receipt.results.filter(row=>row.status==="SKIPPED").map(row=><li key={row.id}>
       {row.title}: {row.reason}</li>)}
     </ul>
    </Alert>:null}
  </Dialog>
 </>;
}
