"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {useEffect,useId,useRef,useState} from "react";
import {Disclosure} from "@/components/ui/disclosure";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {calendarDueAtToIstLocal,calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
import {Dialog} from "@/components/ui/dialog";
import {useToast} from "@/components/ui/toast";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
type LeadChoice={id:string;name:string;companyName:string|null};
const field="min-h-11 w-full md:min-h-9";
export function TpoNewFollowupModal({collegeId}:{collegeId:string}){
 const router=useRouter();
 const formId=useId();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [confirmLeave,setConfirmLeave]=useState(false);
 const [pendingHref,setPendingHref]=useState<string|null>(null);
 const [leads,setLeads]=useState<LeadChoice[]>([]);
 const [search,setSearch]=useState("");
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [searchError,setSearchError]=useState("");
 const [searchRetry,setSearchRetry]=useState(0);
 const [earliest,setEarliest]=useState("");
 const [selectedLead,setSelectedLead]=useState<LeadChoice|null>(null);
 const requestVersion=useRef(0);
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
 function show(){
  if(loading||saving)return;
  const nextSlot=new Date(Math.ceil((Date.now()+1)/300000)*300000);
  setEarliest(calendarDueAtToIstLocal(nextSlot));
  setSearch("");setPage(1);setLeads([]);setLeadId("");setSelectedLead(null);
  setSearchError("");setError("");setOpen(true);
 }
 useEffect(()=>{
  if(!open||search.trim().length<2){
   setLeads([]);setHasMore(false);setLoading(false);setSearchError("");return;
  }
  const version=++requestVersion.current;
  const controller=new AbortController();
  const timer=window.setTimeout(async()=>{
   setLoading(true);setSearchError("");
   try{
    const params=new URLSearchParams({collegeId,q:search.trim(),page:String(page)});
    const response=await fetch("/api/placements/tpo/leads/search?"+params.toString(),{
     credentials:"same-origin",cache:"no-store",signal:controller.signal,
    });
    if(!response.ok)throw new Error("Recruiter search unavailable");
    const result=await response.json() as {leads?:LeadChoice[];hasMore?:boolean};
    if(!Array.isArray(result.leads))throw new Error("Recruiter search unavailable");
    if(version!==requestVersion.current||controller.signal.aborted)return;
    setLeads(result.leads.filter(lead=>typeof lead.id==="string"&&typeof lead.name==="string"));
    setHasMore(result.hasMore===true);
   }catch{
    if(controller.signal.aborted||version!==requestVersion.current)return;
    setSearchError("Recruiter search unavailable");setLeads([]);setHasMore(false);
   }finally{
    if(!controller.signal.aborted&&version===requestVersion.current)setLoading(false);
   }
  },250);
  return ()=>{window.clearTimeout(timer);controller.abort();requestVersion.current++;};
 },[open,collegeId,search,page,searchRetry]);
 function formattedWhenIst(value:string){
  if(!value)return "";
  try{
   const iso=calendarLocalIstToOffset(value);
   const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true,
   }).formatToParts(new Date(iso));
   const get=(part:string)=>parts.find(item=>item.type===part)?.value??"";
   return get("day")+" "+get("month")+" "+get("year")+" "+get("hour")+":"+get("minute")+" "+get("dayPeriod").toUpperCase();
  }catch{return "";}
 }
 async function save(){
  if(saving||loading)return;
  if(!leadId){setError("Choose a recruiter");return;}
  if(!when){setError("Pick a date and time");return;}
  let dueAt:string;
  try{dueAt=calendarLocalIstToOffset(when);}catch{setError("Pick a date and time");return;}
  const timestamp=new Date(dueAt).getTime();
  if(!Number.isFinite(timestamp)||timestamp<=Date.now()||
    new Date(dueAt).getUTCMinutes()%5!==0){
   setError("Pick a future date and time in 5-minute increments");return;
  }
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
   showToast({tone:"success",title:"Follow-up added"});
   router.refresh();
   });
  }catch{setError("Follow-up was not saved");showToast({tone:"error",title:"Follow-up was not saved"});}
 }
 return <>
  <Button variant="ghost" type="button" onClick={event=>{
    if(loading||saving)return;
    const menu=event.currentTarget.closest("details");
    if(menu){menu.open=false;menu.querySelector("summary")?.focus();}
    void show();
   }}
   className="lms-inline-link block min-h-11 w-full rounded-[var(--lms-control-radius)] px-2 py-2 text-left text-sm text-link hover:bg-[rgba(0,0,0,0.035)] active:bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
   Follow-up
  </Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)dismiss();}} title="New follow-up"
   description="Choose a recruiter and when to follow up (IST)."
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
    <Button variant="secondary" type="button" disabled={saving} onClick={dismiss} className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
    <Button variant="primary" type="submit" form={formId} disabled={saving||loading} loading={saving} className="min-h-11 w-full sm:w-auto md:min-h-9">
      {saving?"Adding…":"Add"}
    </Button>
   </div>}>
    <form id={formId} className="space-y-3" onSubmit={event=>{event.preventDefault();void save();}}>
     <div className="grid gap-2">
      <label htmlFor={formId+"-recruiter-search"} className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">Recruiter</label>
      <Input id={formId+"-recruiter-search"} type="search" maxLength={100} autoComplete="off"
       placeholder="Search recruiter or company (2+ characters)" value={search}
       onChange={event=>{setSearch(event.target.value);setPage(1);setSearchError("");}}
       disabled={saving} className={field}/>
      <Select aria-label="Choose recruiter" value={leadId}
       onChange={event=>{
        setLeadId(event.target.value);setError("");
        setSelectedLead(leads.find(lead=>lead.id===event.target.value)??selectedLead);
       }} disabled={saving||loading||search.trim().length<2} className={field} required>
       <option value="">{loading?"Searching recruiters…":"Choose a recruiter"}</option>
       {selectedLead&&!leads.some(lead=>lead.id===selectedLead.id)?
        <option value={selectedLead.id}>{selectedLead.name}{selectedLead.companyName?" · "+selectedLead.companyName:""}</option>:null}
       {leads.map(lead=><option key={lead.id} value={lead.id}>
        {lead.name}{lead.companyName?" · "+lead.companyName:""}
       </option>)}
      </Select>
      {loading?<p role="status" className="text-xs text-muted-foreground">Searching recruiters…</p>:null}
      {searchError?<div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-error">
       <span>{searchError}</span><Button variant="secondary" type="button" disabled={saving||loading}
        onClick={()=>setSearchRetry(current=>current+1)}>Retry</Button>
      </div>:null}
      {search.trim().length>=2&&!loading&&!searchError&&leads.length===0?
       <p role="status" className="text-sm text-body">No recruiters match. Try another name or company.</p>:null}
      {page>1||hasMore?<div className="flex flex-wrap items-center gap-3 text-sm">
       <Button type="button" variant="secondary" disabled={loading||saving||page===1}
        onClick={()=>setPage(current=>Math.max(1,current-1))}>Previous</Button>
       <span>Page {page}</span>
       <Button type="button" variant="secondary" disabled={loading||saving||!hasMore}
        onClick={()=>setPage(current=>current+1)}>Next</Button>
      </div>:null}
     </div>
     <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">When (IST)
      <Input type="datetime-local" required step={300} min={earliest||undefined}
       value={when} onChange={event=>{setWhen(event.target.value);setError("");}}
       disabled={saving} className={field}/>
      {when&&formattedWhenIst(when)?<span className="text-xs text-muted-foreground">
       {formattedWhenIst(when)} IST · 5-minute intervals</span>:null}
     </label>
     <Disclosure title="Note (optional)" className="border-t border-border" contentClassName="px-2 pb-2">
      <Textarea aria-label="Note (optional)" rows={3} maxLength={500} value={note} onChange={event=>setNote(event.target.value)}
       disabled={saving} className={field}/>
     </Disclosure>
     {error?<InlineNotice tone="error" message={error}/>:null}
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
