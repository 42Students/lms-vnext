"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Drawer} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {safeInboundPreview,inboundMailRoutingStatusLabels,type InboundMailRoutingStatus}
 from "@/modules/inbound-mail/message-model";
import {createInboundMailTriageGate} from "@/modules/inbound-mail/triage-submit-model";
import {inboundMailStatusActions,type InboundMailStatus} from "@/modules/inbound-mail/triage-transition-model";

/** Inbox list data is a preview, never a full-message permission grant.
 * The full plain-text body is fetched only after opening the global-SA drawer. */
export type InboundMailRow={
 id:string;receivedAt:string;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;version:number;
 senderDisplayName?:string|null;senderKind?:string|null;
 collegeName?:string|null;routingStatus?:string|null;handledAt?:string|null;
};
type Detail=InboundMailRow;
function receivedLabel(raw:string){
 const date=new Date(raw);
 if(!Number.isFinite(date.getTime()))return "Date unavailable";
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",
  hour:"numeric",minute:"2-digit",hour12:true,
 }).formatToParts(date);
 const val=(name:string)=>parts.find(part=>part.type===name)?.value??"";
 return val("day")+" "+val("month")+", "+val("hour")+":"+val("minute")+" "+val("dayPeriod").toUpperCase();
}
function sender(row:InboundMailRow){
 return row.senderDisplayName?.trim()||row.fromAddress?.trim()||"Unknown sender";
}
const statusLabel:Record<string,string>={NEW:"To read",TRIAGED:"Being handled",RESOLVED:"Done"};

export function InboundMailList({rows}:{rows:readonly InboundMailRow[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<InboundMailRow|null>(null);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [detailLoading,setDetailLoading]=useState(false);
 const [detailError,setDetailError]=useState("");
 const [detailRetry,setDetailRetry]=useState(0);
 const [emptyMode,setEmptyMode]=useState("NEW");
 const [overrides,setOverrides]=useState<Record<string,{status:string;version:number}>>({});
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [messageError,setMessageError]=useState(false);
 const triageGate=useRef(createInboundMailTriageGate());
 useEffect(()=>{
  const url=new URL(window.location.href);
  const selectedView=url.searchParams.get("status")??
   (url.searchParams.get("show")==="DONE"?"RESOLVED":"NEW");
  setEmptyMode(selectedView);
 },[]);
 useEffect(()=>{
  if(!selected)return;
  const controller=new AbortController();
  let active=true;
  const selectedId=selected.id;
  // Selecting a second row or closing the drawer cancels the previous read.
  const load=async()=>{
    setDetail(null);setDetailError("");setDetailLoading(true);
    try{
      const response=await fetch("/api/admin/inbound-mail/"+encodeURIComponent(selectedId),{
       method:"GET",credentials:"same-origin",signal:controller.signal,cache:"no-store",
      });
      if(!response.ok)throw Error("Couldn't load this email");
      const payload=await response.json() as {message?:Detail};
      if(!payload.message||payload.message.id!==selectedId)throw Error("Couldn't load this email");
      if(active)setDetail(payload.message);
    }catch(error){
      if(active&&!(error instanceof Error&&error.name==="AbortError"))
        setDetailError("Couldn't load this email");
    }finally{if(active)setDetailLoading(false);}
  };
  void load();
  return ()=>{active=false;controller.abort();};
 },[selected,detailRetry]);
 function open(row:InboundMailRow){
  if(busy)return;
  setMessage("");setMessageError(false);
  setSelected(row);setDetail(null);setDetailError("");
 }
 function close(){
  if(busy)return;
  setSelected(null);setDetail(null);setDetailError("");
 }
 async function change(row:InboundMailRow,status:InboundMailStatus){
  if(!triageGate.current.tryBegin())return;
  const current=overrides[row.id]??row;
  setBusy(true);setMessage("");setMessageError(false);
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch("/api/admin/inbound-mail/status",{
    method:"PATCH",credentials:"same-origin",signal:controller.signal,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:row.id,expectedStatus:current.status,expectedVersion:current.version,status}),
   });
   if(!response.ok)throw Error(response.status===409?
    "Message was changed elsewhere. Refresh before retrying.":"Could not update message status.");
   const saved=await response.json() as {status:string;version:number};
   setOverrides(previous=>({...previous,[row.id]:{status:saved.status,version:saved.version}}));
   if(status==="RESOLVED")closeAfterSave();
   setMessage(status==="RESOLVED"?"":status==="TRIAGED"?
    "Message marked being handled.":"Message moved back to To read.");
   router.refresh();
  }catch(error){
   setMessageError(true);setMessage(error instanceof Error&&error.name==="AbortError"?
    "Request timed out. Refresh the inbox before trying again.":error instanceof Error?
    error.message:"Could not update message status.");
  }finally{window.clearTimeout(timeout);triageGate.current.end();setBusy(false);}
 }
 function closeAfterSave(){setSelected(null);setDetail(null);setDetailError("");}
 return <div className="min-w-0 space-y-4">
  {rows.length===0?<div className="flex min-w-0 flex-col items-start gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
    <p role="status" className="text-sm text-body">
     {emptyMode==="NEW"?"Nothing waiting to be read":"No emails"}
    </p>
    <Link href="/admin/inbound-mail?status=NEW" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-link underline md:min-h-9">
     Clear
    </Link>
   </div>:<div className="min-w-0 overflow-x-auto border-y border-border">
    <table className="w-full min-w-[680px] border-collapse text-left text-sm">
     <caption className="sr-only">Inbound messages; select a row to read the full email</caption>
     <thead><tr className="bg-[var(--lms-neutral-50)] text-xs text-muted-foreground">
      <th className="border-b border-border px-3 py-3 font-semibold" scope="col">Received</th>
      <th className="border-b border-border px-3 py-3 font-semibold" scope="col">From</th>
      <th className="border-b border-border px-3 py-3 font-semibold" scope="col">Email</th>
      <th className="border-b border-border px-3 py-3 font-semibold" scope="col">Status</th>
     </tr></thead>
     <tbody>
      {rows.map(row=><tr key={row.id} tabIndex={0} role="button"
        aria-label={"Read inbound email "+(row.subject?.trim()||"(no subject)")}
        onClick={()=>open(row)}
        onKeyDown={event=>{
          if(event.key==="Enter"||event.key===" "){event.preventDefault();open(row);}
        }}
        className="cursor-pointer border-b border-border transition-colors hover:bg-[var(--lms-neutral-50)] focus-visible:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary-text)]">
        <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-body">
         <time dateTime={row.receivedAt}>{receivedLabel(row.receivedAt)}</time>
        </td>
        <td className="max-w-[200px] px-3 py-3 align-top">
         <span className="block break-words font-semibold text-foreground">{sender(row)}</span>
         {row.senderDisplayName?<span className="block break-all text-xs text-muted-foreground">{row.fromAddress||"Unknown sender"}</span>:null}
         {row.senderKind?<span className="mt-1 inline-flex max-w-full flex-wrap items-center gap-1 text-xs">
          <StatusBadge>{row.senderKind}</StatusBadge>
          {row.collegeName?<span className="text-muted-foreground">{row.collegeName}</span>:null}
         </span>:null}
        </td>
        <td className="max-w-[520px] px-3 py-3 align-top">
         <strong className="block max-w-[520px] truncate text-sm font-semibold text-[var(--lms-heading)]">
          {row.subject?.trim()||"(no subject)"}
         </strong>
         <span className="block max-w-[520px] truncate text-xs text-muted-foreground">
          {safeInboundPreview(row.bodyPlain??"",1000)}
         </span>
        </td>
        <td className="whitespace-nowrap px-3 py-3 align-top">
         <StatusBadge>{statusLabel[overrides[row.id]?.status??row.status]??"Unknown status"}</StatusBadge>
        </td>
       </tr>)}
     </tbody>
    </table>
   </div>}
  {selected?<Drawer open side="right" className="md:!w-[min(640px,100vw)]"
    onOpenChange={opened=>{if(!opened)close();}}
    title={selected.subject?.trim()||"(no subject)"}
    description={selected.toAddress+" · "+receivedLabel(selected.receivedAt)}>
    <section className="min-w-0 space-y-4">
     <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      {selected.routingStatus&&selected.routingStatus!=="STORED"?
       <StatusBadge>{inboundMailRoutingStatusLabels[selected.routingStatus as InboundMailRoutingStatus]??selected.routingStatus}</StatusBadge>:
       <span className="text-xs text-muted-foreground">Inbound message</span>}
      <div className="flex flex-wrap gap-2">
       {(selected.routingStatus==="POSTED"?[]:
         inboundMailStatusActions(overrides[selected.id]?.status??selected.status)).map(action=>
         <Button key={action.status} type="button" size="sm"
          variant={action.status==="RESOLVED"?"primary":"secondary"}
          disabled={busy} loading={busy} onClick={()=>void change(selected,action.status)}>
          {action.label}
         </Button>)}
      </div>
     </div>
     {message?<p role={messageError?"alert":"status"} aria-live="polite"
       className={"text-sm "+(messageError?"text-error":"text-body")}>{message}</p>:null}
     <dl className="grid min-w-0 gap-2 border-b border-border pb-3 text-sm">
      <div><dt className="font-semibold">Sender</dt><dd className="break-all">{sender(selected)}</dd></div>
      <div><dt className="font-semibold">To</dt><dd className="break-all">{selected.toAddress}</dd></div>
      <div><dt className="font-semibold">Received</dt><dd><time dateTime={selected.receivedAt}>{receivedLabel(selected.receivedAt)}</time></dd></div>
     </dl>
     {detailLoading?<p role="status" className="py-4 text-sm text-muted-foreground">Loading...</p>:null}
     {detailError?<Alert tone="warning" title="Couldn't load this email">
       The full message could not be retrieved. No partial preview is represented as a complete email.
       <Button type="button" variant="secondary" size="sm" className="mt-3"
        onClick={()=>setDetailRetry(current=>current+1)}>Retry</Button>
     </Alert>:null}
     {!detailLoading&&!detailError&&detail?<div className="min-w-0">
      <p className="whitespace-pre-wrap break-words text-sm leading-[22px] text-body">
       {detail.bodyPlain||"No message body"}
      </p>
     </div>:null}
    </section>
   </Drawer>:null}
 </div>;
}
