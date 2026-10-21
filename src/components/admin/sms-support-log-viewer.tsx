"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {DataTable} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {Select} from "@/components/ui/select";

/** Support-only response: no full phone, recipient HMAC, provider payload,
 * template substitutions or credentials can leave the server. */
type SupportRow={
 id:string;purpose:string;recipientSuffix:string|null;
 status:"SENT"|"FAILED";providerMessageId:string|null;
 errorSummary:string|null;collegeId:string|null;createdAt:string;
 provider:string;providerStatus:string;
};
type SupportPage={
 ready:boolean;content:SupportRow[];number:number;page:number;size:number;
 totalElements:number;totalPages:number;error:string|null;retryable:boolean;note:string;
};
const NOTICE="SENT means the operator accepted the message. Handset delivery is not reported by the provider.";
export function SmsSupportLogViewer(){
 const [suffix,setSuffix]=useState("");
 const [purpose,setPurpose]=useState("");
 const [size,setSize]=useState(50);
 const [result,setResult]=useState<SupportPage|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const request=useRef<AbortController|null>(null);
 const afterPage=useRef<HTMLDivElement|null>(null);
 const load=useCallback(async(page:number,filters:{recipientSuffix:string;purpose:string;size:number},focus=false)=>{
  request.current?.abort();
  const controller=new AbortController();
  request.current=controller;setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/sms-log",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...filters,page}),signal:controller.signal,
   });
   if(!response.ok)throw Error(response.status===403
    ?"You do not have permission to read SMS attempt records."
    :"SMS history cannot be loaded. Retry later.");
   const data=await response.json() as SupportPage;
   if(controller.signal.aborted)return;
   if(!data.ready){setError(data.error||"SMS history cannot be loaded. Retry later.");setResult(null);}
   else {setResult(data);if(focus)afterPage.current?.focus();}
  }catch(failure){
   if(!controller.signal.aborted){setResult(null);setError(failure instanceof Error?failure.message:"SMS history cannot be loaded. Retry later.");}
  }finally{if(!controller.signal.aborted)setLoading(false);}
 },[]);
 useEffect(()=>{
  void load(0,{recipientSuffix:"",purpose:"",size:50});
  return ()=>request.current?.abort();
 },[load]);
 const filters={recipientSuffix:suffix.replace(/[^0-9]/g,"").slice(-4),purpose:purpose.trim(),size};
 const canSearch=!suffix.trim()||filters.recipientSuffix.length===4;
 const changePage=(next:number)=>{
  if(!result||loading||next<0||next>=result.totalPages)return;
  void load(next,filters,true);
 };
 return <section aria-label="SMS provider attempt support log" className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
  <Alert tone="info">{NOTICE} This log never reveals the full recipient number, a message body or a provider token.</Alert>
  <form className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,280px)_minmax(0,100px)_auto] md:items-end"
   onSubmit={event=>{event.preventDefault();if(canSearch)void load(0,filters);}}>
   <label htmlFor="sms-support-suffix" className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Recipient (last four digits)
    <Input id="sms-support-suffix" value={suffix} onChange={event=>setSuffix(event.target.value)}
      autoComplete="off" inputMode="numeric" maxLength={32} placeholder="1234" aria-invalid={!canSearch}/>
   </label>
   <label htmlFor="sms-support-purpose" className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Purpose
    <Input id="sms-support-purpose" value={purpose} maxLength={100}
      onChange={event=>setPurpose(event.target.value)} placeholder="Search purpose"/>
   </label>
   <label htmlFor="sms-support-page-size" className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Rows per page
    <Select id="sms-support-page-size" 
     value={size} onChange={event=>setSize(Number(event.target.value))}>
     <option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
    </Select>
   </label>
   <Button variant="primary" type="submit" disabled={loading||!canSearch}
    className="min-h-11 md:min-h-9">{loading?"Loading…":"Filter"}</Button>
  </form>
  {!canSearch?<p role="alert" className="text-sm text-[var(--lms-error)]">Enter at least four digits for the recipient suffix.</p>:null}
  {error?<Alert tone="error" role="alert">{error} <Button type="button" variant="secondary"
    className="ml-2 min-h-11 md:min-h-9" disabled={loading} onClick={()=>void load(result?.number??0,filters)}>Retry</Button></Alert>:null}
  <div ref={afterPage} tabIndex={-1} role="status" className="text-sm text-muted-foreground focus:outline-none">
   {loading?"Loading SMS attempt records…":result
    ?`${result.totalElements} attempts · Page ${result.number+1} of ${Math.max(1,result.totalPages)}`
    :error?"Attempt history unavailable.":"No attempt history loaded."}
  </div>
  {result?<DataTable rows={result.content} getRowKey={row=>row.id}
   caption="Provider SMS attempt log"
   empty={<p className="text-sm">No recorded SMS attempts match these filters.</p>}
   columns={[
    {key:"time",header:"Attempted",mobilePriority:"primary" as const,
     cell:row=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(row.createdAt))+" IST"},
    {key:"status",header:"Status",mobilePriority:"secondary" as const,
     cell:row=><StatusBadge tone={row.status==="SENT"?"success":"warning"}>{row.status}</StatusBadge>},
    {key:"recipient",header:"Recipient",mobilePriority:"secondary" as const,
     cell:row=>row.recipientSuffix?"••••"+row.recipientSuffix:"Not stored"},
    {key:"purpose",header:"Purpose",mobilePriority:"secondary" as const,cell:row=>row.purpose},
    {key:"provider",header:"Provider ID",mobilePriority:"secondary" as const,
     cell:row=>row.providerMessageId??"—"},
    {key:"failure",header:"Failure reason",mobilePriority:"secondary" as const,
     cell:row=>row.errorSummary??"—"},
   ]}
  />:null}
  {result&&result.totalPages>1?<nav aria-label="SMS log pages" className="flex flex-wrap items-center gap-3">
   <Button type="button" variant="secondary" disabled={loading||result.number===0}
    onClick={()=>changePage(result.number-1)} className="min-h-11 md:min-h-9">Previous</Button>
   <span className="text-sm">Page {result.number+1} of {result.totalPages}</span>
   <Button type="button" variant="secondary" disabled={loading||result.number+1>=result.totalPages}
    onClick={()=>changePage(result.number+1)} className="min-h-11 md:min-h-9">Next</Button>
  </nav>:null}
 </section>;
}
