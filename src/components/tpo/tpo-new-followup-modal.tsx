"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type LeadChoice={id:string;name:string;companyName:string|null};
const field="min-h-11 w-full md:min-h-9";
export function TpoNewFollowupModal({collegeId}:{collegeId:string}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [confirmLeave,setConfirmLeave]=useState(false);
 const [pendingHref,setPendingHref]=useState<string|null>(null);
 const [leads,setLeads]=useState<LeadChoice[]>([]);
 const [leadId,setLeadId]=useState("");
 const [when,setWhen]=useState("");
 const [note,setNote]=useState("");
 const [loading,setLoading]=useState(false);
 const {pending:saving,run}=useGuardedAction({timeoutMs:30000});
 const [error,setError]=useState("");
 const hasDraft=open&&Boolean(leadId||when||note.trim());
 useEffect(()=>{
  if(!hasDraft)return;
  const protectUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  const protectLinks=(event:MouseEvent)=>{
   const target=event.target;
   if(!(target instanceof Element))return;
   const link=target.closest("a[href]");
   if(link&&link instanceof HTMLAnchorElement&&!link.hasAttribute("download")){
    const destination=new URL(link.href,window.location.href);
    if(destination.origin!==window.location.origin)return;
    event.preventDefault();event.stopPropagation();
    setPendingHref(destination.pathname+destination.search+destination.hash);
    setConfirmLeave(true);
   }
  };
  window.addEventListener("beforeunload",protectUnload);
  document.addEventListener("click",protectLinks,true);
  return ()=>{window.removeEventListener("beforeunload",protectUnload);document.removeEventListener("click",protectLinks,true);};
 },[hasDraft]);
 function dismiss(){
  if(saving)return;
  if(hasDraft){setPendingHref(null);setConfirmLeave(true);return;}
  setOpen(false);
 }
 async function show(){
  if(loading||saving)return;
  setOpen(true);setLoading(true);setError("");
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
   showToast({tone:"success",title:"Follow-up added",description:"It shows on the calendar."});
   router.refresh();
   });
  }catch{setError("Could not save the follow-up");}
 }
 return <>
  <Button variant="ghost" type="button" onClick={event=>{
    if(loading||saving)return;
    const menu=event.currentTarget.closest("details");
    if(menu){menu.open=false;menu.querySelector("summary")?.focus();}
    void show();
   }}
   className="lms-inline-link block min-h-11 w-full rounded-[8px] px-2 py-2 text-left text-sm text-link hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
   Follow-up
  </Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)dismiss();}} title="New follow-up"
   description="Choose a recruiter and when to follow up (IST).">
    <form className="space-y-3" onSubmit={event=>{event.preventDefault();void save();}}>
     <label className="grid gap-1 text-sm font-semibold text-body">Recruiter
      <Select value={leadId} onChange={event=>{setLeadId(event.target.value);setError("");}}
       disabled={saving||loading} className={field} required>
       <option value="">{loading?"Loading recruiters…":"Choose a recruiter"}</option>
       {leads.map(lead=><option key={lead.id} value={lead.id}>
        {lead.name}{lead.companyName?" · "+lead.companyName:""}
       </option>)}
      </Select>
     </label>
     <label className="grid gap-1 text-sm font-semibold text-body">When (IST)
      <Input type="datetime-local" required value={when} onChange={event=>{setWhen(event.target.value);setError("");}}
       disabled={saving} className={field}/>
     </label>
     <label className="grid gap-1 text-sm font-semibold text-body">Note (optional)
      <Textarea rows={3} maxLength={500} value={note} onChange={event=>setNote(event.target.value)}
       disabled={saving} className={field}/>
     </label>
     {error?<InlineNotice tone="error" message={error}/>:null}
     <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Button variant="secondary" type="button" disabled={saving} onClick={dismiss}
       className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm md:min-h-9">Cancel</Button>
      <Button variant="primary" type="submit" disabled={saving||loading} className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50 md:min-h-9">
       {saving?"Adding…":"Add"}
      </Button>
     </div>
    </form>
  </Dialog>
  <ConfirmDialog open={confirmLeave} onOpenChange={setConfirmLeave}
   title="Discard this unfinished follow-up?" confirmLabel="Discard" confirmVariant="danger"
   onConfirm={()=>{
    const href=pendingHref;
    setConfirmLeave(false);setPendingHref(null);setOpen(false);
    setLeadId("");setWhen("");setNote("");
    if(href)router.push(href);
   }}/>
 </>;
}
