"use client";
import {useEffect,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
type LeadChoice={id:string;name:string;companyName:string|null};
const field="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";
export function TpoNewFollowupModal({collegeId}:{collegeId:string}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [leads,setLeads]=useState<LeadChoice[]>([]);
 const [leadId,setLeadId]=useState("");
 const [when,setWhen]=useState("");
 const [note,setNote]=useState("");
 const [loading,setLoading]=useState(false);
 const {pending:saving,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState("");
 const [toast,setToast]=useState("");
 const hasDraft=open&&Boolean(leadId||when||note.trim());
 useEffect(()=>{
  if(!hasDraft)return;
  const protectUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  const protectLinks=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element))return;
   const link=target.closest("a[href]");
   if(link&&!window.confirm("Discard this unfinished follow-up?")){
    event.preventDefault();event.stopPropagation();
   }
  };
  window.addEventListener("beforeunload",protectUnload);
  document.addEventListener("click",protectLinks,true);
  return ()=>{window.removeEventListener("beforeunload",protectUnload);document.removeEventListener("click",protectLinks,true);};
 },[hasDraft]);
 function dismiss(){
  if(saving)return;
  if(hasDraft&&!window.confirm("Discard this unfinished follow-up?"))return;
  setOpen(false);
 }
 async function show(){
  if(loading||saving)return;
  setOpen(true);setLoading(true);setError("");setToast("");
  try{
   const response=await fetch("/api/placements/tpo/leads?collegeId="+encodeURIComponent(collegeId),{
    cache:"no-store",credentials:"same-origin",
   });
   if(!response.ok)throw Error(response.status===503?"Recruiter CRM is unavailable until database registration is verified.":"Could not load recruiters.");
   const raw=await response.json() as {leads?:LeadChoice[]};
   if(!Array.isArray(raw.leads))throw Error("Could not load recruiters.");
   setLeads(raw.leads.filter(lead=>typeof lead.id==="string"&&typeof lead.name==="string"));
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not load recruiters.");}
  finally{setLoading(false);}
 }
 async function save(){
  if(saving||loading)return;
  if(!leadId){setError("Choose a recruiter");return;}
  if(!when){setError("Pick a date and time");return;}
  let dueAt:string;
  try{dueAt=calendarLocalIstToOffset(when);}catch{setError("Pick a date and time");return;}
  setError("");
  try{
   await run(async () => {
   const response=await fetch("/api/placements/tpo/calendar/follow-ups",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({leadId,dueAt,note:note.trim()||null}),
   });
   if(!response.ok)throw Error("Could not save the follow-up");
   const result=await response.json() as {followup?:{id:string}};
   if(!result.followup?.id)throw Error("Could not save the follow-up");
   setOpen(false);setLeadId("");setWhen("");setNote("");
   setToast("Follow-up added. It shows on the calendar.");
   router.refresh();
   });
  }catch{setError("Could not save the follow-up");}
 }
 return <>
  <button type="button" onClick={()=>void show()}
   className="block min-h-10 w-full rounded px-2 py-2 text-left text-sm text-primary-text hover:bg-primary-subtle">
   Follow-up
  </button>
  {toast?<p role="status" className="px-2 py-1 text-xs text-body">{toast}</p>:null}
  {open?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
    onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();dismiss();}}}>
   <section role="dialog" aria-modal="true" aria-labelledby="tpo-new-followup-title"
    className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xl">
    <h2 id="tpo-new-followup-title" className="text-lg font-semibold">New follow-up</h2>
    <p className="text-sm text-body">Choose a recruiter and when to follow up (IST).</p>
    <form className="space-y-3" onSubmit={event=>{event.preventDefault();void save();}}>
     <label className="grid gap-1 text-sm font-semibold text-body">Recruiter
      <select value={leadId} onChange={event=>{setLeadId(event.target.value);setError("");}}
       disabled={saving||loading} className={field} required>
       <option value="">{loading?"Loading recruiters…":"Choose a recruiter"}</option>
       {leads.map(lead=><option key={lead.id} value={lead.id}>
        {lead.name}{lead.companyName?" · "+lead.companyName:""}
       </option>)}
      </select>
     </label>
     <label className="grid gap-1 text-sm font-semibold text-body">When (IST)
      <input type="datetime-local" required value={when} onChange={event=>{setWhen(event.target.value);setError("");}}
       disabled={saving} className={field}/>
     </label>
     <label className="grid gap-1 text-sm font-semibold text-body">Note (optional)
      <textarea rows={3} maxLength={500} value={note} onChange={event=>setNote(event.target.value)}
       disabled={saving} className={field}/>
     </label>
     {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
     <div className="flex justify-end gap-2">
      <button type="button" disabled={saving} onClick={dismiss}
       className="min-h-11 rounded-md border border-border px-4 text-sm">Cancel</button>
      <button type="submit" disabled={saving||loading} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
       {saving?"Adding…":"Add"}
      </button>
     </div>
    </form>
   </section>
  </div>:null}
 </>;
}
