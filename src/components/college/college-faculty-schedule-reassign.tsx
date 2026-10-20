"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {LoadingState} from "@/components/ui/loading-state";
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
 [loaded,setLoaded]=useState(false),
 [error,setError]=useState(""),[receipt,setReceipt]=useState<Receipt|null>(null);
 const {ask,confirmation}=useCollegeConfirmation();
 const base="/api/college/faculty/"+encodeURIComponent(membershipId)+"/reassign-schedules";
 async function show(){
  setOpen(true);setBusy(true);setError("");setReceipt(null);
  setSelected("");setOptions([]);setUpcoming(0);setLoaded(false);
  try{const response=await fetch(base,{cache:"no-store"});
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw Error(body?.error??"Could not read faculty schedules");
   setOptions(body.faculty??[]);setUpcoming(body.upcoming??0);setLoaded(true);
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
  <Button variant="secondary" type="button" onClick={()=>void show()}
   className="min-h-11 w-full md:min-h-9 md:w-auto">
   Reassign class schedules</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)setOpen(false);}}
   title="Reassign class schedules" dismissible={!busy} className="max-[767px]:w-full"
   footer={<div className="flex w-full min-w-0 flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end">
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}
      className="min-h-11 w-full md:min-h-9 md:w-auto">Close</Button>
     <Button variant="primary" type="button" disabled={busy||!loaded||!selected||!upcoming}
      onClick={()=>void submit()} className="min-h-11 w-full md:min-h-9 md:w-auto"
      loading={busy&&loaded}>{busy&&loaded?"Reassigning…":"Reassign class schedules"}</Button>
   </div>}>
    <div className="min-w-0 space-y-4">
      {!loaded&&busy?<LoadingState label="Reassign class schedules" />:null}
      {loaded?<div className="min-w-0 space-y-3">
        <p className="text-sm">{upcoming} upcoming scheduled session(s) for {name}.</p>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assign to
          <Select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}>
            <option value="">Choose a replacement faculty</option>
            {options.map(row=><option key={row.id} value={row.id}>{row.name??row.id}</option>)}
          </Select>
        </label>
        <p className="text-xs text-muted-foreground">Only future scheduled sessions are changed. Overlapping sessions are skipped; existing teaching history is retained.</p>
      </div>:null}
      {error?<div className="space-y-3">
        <Alert tone="error">{error}</Alert>
        {!loaded&&!busy?<Button type="button" variant="secondary" onClick={()=>void show()}
          className="min-h-11 w-full md:min-h-9 md:w-auto">Retry</Button>:null}
      </div>:null}
      {receipt?<Alert tone="success" className="space-y-2">
        <p className="font-semibold">Reassigned {receipt.reassigned} of {receipt.total} upcoming session(s).</p>
        {receipt.skipped?<details className="min-w-0">
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:py-2">{receipt.skipped} skipped.</summary>
          <ul className="space-y-1 pl-4 text-sm">
            {receipt.results.filter(row=>row.status==="SKIPPED").map(row=><li key={row.id}>
              {row.title}: {row.reason}</li>)}
          </ul>
        </details>:<p>{receipt.skipped} skipped.</p>}
      </Alert>:null}
    </div>
  </Dialog>
 </>;
}
