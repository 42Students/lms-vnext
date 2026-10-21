"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
type Student={membershipId:string;displayName:string|null};
type Role={id:string;title:string};
export function TpoNonApplicantActions({jobId,roles,students,canAdd,reminder}:{
 jobId:string;roles:readonly Role[];students:readonly Student[];
 canAdd:boolean;reminder:{previewToken:string|null;count:number;allowed:boolean;alreadySent:boolean;reason?:string|null};
}){
 const router=useRouter(),locked=useRef(false);
 const [roleId,setRoleId]=useState(roles[0]?.id??"");
 const [selected,setSelected]=useState<string[]>([]);
 const [confirm,setConfirm]=useState<"ADD"|"REMIND"|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const base="/api/placements/jobs/"+encodeURIComponent(jobId)+"/bulk-add";
 async function submit(){
  if(!confirm||locked.current)return;
  locked.current=true;setBusy(true);setError("");setSuccess("");
  try{
   if(confirm==="ADD"){
    const data=await apiFetch<{counts:{added:number;alreadyAdded:number;ineligible:number};
      results:{membershipId:string;status:string;reason?:string}[]}>(base,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({roleOptionId:roleId,membershipIds:selected,confirmed:true}),
    });
    if(data.counts.added===0)throw Error(data.results[0]?.reason??
     (data.counts.alreadyAdded?"Already on this drive":"Not eligible for this drive"));
    setSuccess(data.counts.added+" Added · "+data.counts.alreadyAdded+
     " Already on this drive · "+data.counts.ineligible+" Not eligible for this drive.");
    if(data.results.some(row=>row.status!=="added"))
     setError(data.results.filter(row=>row.status!=="added").map(row=>
      row.reason??"Already on this drive").join("; "));
    setSelected([]);
   }else{
    if(!reminder.previewToken)throw Error("Reminder preview is unavailable. Refresh.");
    const data=await apiFetch<{reminded:number;alreadySent:boolean;reason:string|null}>(
     "/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/remind-not-applied",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({expectedPreviewToken:reminder.previewToken,confirmed:true}),
     });
    setSuccess(data.alreadySent?"These students were already reminded today.":
     data.reminded+" reminder(s) sent.");
   }
   setConfirm(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not complete the action.");}
  finally{locked.current=false;setBusy(false);}
 }
 return <section aria-label="Registered non-applicant actions" className="space-y-3">
  <div className="flex flex-wrap items-end gap-3">
   <label className="grid gap-1 text-sm font-semibold">Role to apply for
    <Select value={roleId} onChange={e=>setRoleId(e.target.value)} disabled={busy}>
     {roles.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
    </Select>
   </label>
   <Button type="button" disabled={busy||!canAdd||!roleId||!selected.length}
    onClick={()=>setConfirm("ADD")}>Apply on behalf ({selected.length})</Button>
   <Button variant="secondary" type="button"
    disabled={busy||!reminder.allowed||reminder.alreadySent||!reminder.previewToken||reminder.count===0}
    onClick={()=>setConfirm("REMIND")}>
    Remind {reminder.count} not-applied student(s)
   </Button>
  </div>
  <p className="text-xs text-muted-foreground">Reminders are limited to once per 20 hours for this drive and deduplicated in the database.</p>
  {reminder.reason?<p role="status" className="text-sm text-muted-foreground">
   Reminder unavailable: {reminder.reason}
  </p>:null}
  <div className="min-w-0 overflow-x-auto border border-border">
   <table className="w-full min-w-[420px] text-left text-sm">
    <thead><tr className="border-b border-border">
     <th className="p-3">Include</th><th className="p-3">Student</th><th className="p-3">Status</th>
    </tr></thead>
    <tbody>{students.map(row=><tr key={row.membershipId} className="border-b border-border last:border-0">
      <td className="p-3"><input type="checkbox" aria-label={"Select "+(row.displayName??"learner")}
       disabled={busy||!canAdd} checked={selected.includes(row.membershipId)}
       onChange={e=>setSelected(current=>e.target.checked?
        [...current,row.membershipId]:current.filter(id=>id!==row.membershipId))}/></td>
      <td className="p-3">{row.displayName??"Unnamed learner"}</td>
      <td className="p-3">Eligible · not applied</td>
     </tr>)}</tbody>
   </table>
  </div>
  <ConfirmDialog open={confirm!==null} onOpenChange={next=>{if(!next&&!busy)setConfirm(null);}}
   title={confirm==="ADD"?"Apply on behalf of selected students?":"Remind students who have not applied?"}
   description={confirm==="ADD"
    ?"The TPO applies to the selected role for each checked student. Eligibility, registration, active job and membership status are rechecked before writing.":
    "Send an in-app placement reminder to the currently eligible registered students who have not applied. The recipient set and daily dedupe are checked at confirmation."}
   confirmLabel={confirm==="ADD"?"Add to drive":"Send reminders"}
   confirmVariant="primary" pending={busy} onConfirm={()=>void submit()}/>
  {error?<Alert tone="warning" role="alert">{error}</Alert>:null}
  {success?<Alert tone="success" role="status">{success}</Alert>:null}
 </section>;
}
