"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Drawer} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {safeInboundPreview,inboundMailRoutingStatusLabels,type InboundMailRoutingStatus} from "@/modules/inbound-mail/message-model";
import {createInboundMailTriageGate} from "@/modules/inbound-mail/triage-submit-model";
import {inboundMailStatusActions,type InboundMailStatus} from "@/modules/inbound-mail/triage-transition-model";
export type InboundMailRow={
 id:string;receivedAt:string;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;version:number;
 // Optional source-enriched details: never infer recipient identity or outcome
 // solely from sender addresses or the manual triage state.
 senderDisplayName?:string|null;senderKind?:string|null;
 collegeName?:string|null;routingStatus?:string|null;handledAt?:string|null;
};
export function InboundMailList({rows}:{rows:readonly InboundMailRow[]}) {
 const router=useRouter();
 const [selected,setSelected]=useState<InboundMailRow|null>(null);
 const [overrides,setOverrides]=useState<Record<string,{status:string;version:number}>>({});
 const [busy,setBusy]=useState(false);
 const triageGate=useRef(createInboundMailTriageGate());
 const [message,setMessage]=useState("");
 const [messageError,setMessageError]=useState(false);
 async function change(row:InboundMailRow,status:InboundMailStatus){
  if(!triageGate.current.tryBegin())return;
  const current=overrides[row.id]??row;
  setBusy(true);setMessage("");setMessageError(false);
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch("/api/admin/inbound-mail/status",{
    method:"PATCH",credentials:"same-origin",signal:controller.signal,headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:row.id,expectedStatus:current.status,expectedVersion:current.version,status}),
   });
   if(!response.ok)throw Error(response.status===409?"Message was changed elsewhere. Refresh before retrying.":"Could not update message status.");
   const saved=await response.json() as {status:string;version:number};
   setOverrides(previous=>({...previous,[row.id]:{status:saved.status,version:saved.version}}));
   if(status==="RESOLVED")setSelected(null);
   setMessage(status==="RESOLVED"?"":status==="TRIAGED"?"Message marked being handled.":"Message moved back to To read.");
   router.refresh();
  }catch(error){setMessageError(true);setMessage(error instanceof Error&&error.name==="AbortError"?"Request timed out. Refresh the inbox before trying again.":error instanceof Error?error.message:"Could not update message status.");}
  finally{window.clearTimeout(timeout);triageGate.current.end();setBusy(false);}
 }

 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  {rows.length===0?
   <div className="flex min-w-0 flex-col items-start gap-[var(--lms-space-3)] border-y border-border py-[var(--lms-space-5)] min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
    <p role="status" className="text-sm text-body leading-[22px]">No inbound messages match these filters.</p>
    <Link href="/admin/inbound-mail?status=NEW" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white min-[768px]:min-h-9 min-[768px]:w-auto">Clear</Link>
   </div>:
   <>
    <div className="min-w-0 divide-y divide-border border-y border-border">
     {rows.map(row=><article key={row.id} className="min-w-0 py-4">
      <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between min-[768px]:gap-[var(--lms-space-6)]">
       <div className="min-w-0 flex-1 space-y-[var(--lms-space-1)]">
        <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
         <h2 className="min-w-0 break-words text-base font-semibold text-[var(--lms-heading)]">{row.subject||"(No subject)"}</h2>
         {row.routingStatus ? <StatusBadge>{inboundMailRoutingStatusLabels[row.routingStatus as InboundMailRoutingStatus]??row.routingStatus}</StatusBadge> : null}
         <StatusBadge>{({NEW:"To read",TRIAGED:"Being handled",RESOLVED:"Done"} as Record<string,string>)[overrides[row.id]?.status??row.status]??"Unknown status"}</StatusBadge>
         {row.handledAt ? <StatusBadge>Done</StatusBadge> : null}
        </div>
        <p className="min-w-0 break-words text-sm text-body leading-[22px]">
          {row.senderDisplayName ? <strong>{row.senderDisplayName} · </strong> : null}
          From {row.fromAddress} · To {row.toAddress}
          {row.senderKind ? <span className="ml-2 font-semibold">{row.senderKind}{row.collegeName ? " · "+row.collegeName : ""}</span> : null}
        </p>
        <p className="line-clamp-2 max-w-prose break-words text-sm text-muted-foreground print:line-clamp-none leading-[22px]">{safeInboundPreview(row.bodyPlain)}</p>
        <p className="text-xs text-muted-foreground leading-5">{new Date(row.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
       </div>
       <Button type="button" variant="secondary" className="w-full min-h-11 shrink-0 min-[768px]:w-auto min-[768px]:min-h-9 print:hidden" onClick={()=>{setMessage("");setMessageError(false);setSelected(row);}}>Read message</Button>
      </div>
     </article>)}
    </div>
    <p className="text-xs text-muted-foreground leading-5">
      Sender and routing badges appear only when verified identity and routing metadata are available.
    </p>
   </>}
  {selected?<Drawer open onOpenChange={open=>{if(!open&&!busy)setSelected(null)}} title={selected.subject||"(No subject)"}
    description="Private inbound message"
    footer={<div className="flex w-full min-w-0 flex-col gap-[var(--lms-space-3)]">
     {message?<p role={messageError?"alert":"status"} aria-live="polite" className={"max-w-prose break-words text-sm "+(messageError?"text-error":"text-body")}>{message}</p>:null}
     <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] min-[768px]:flex-row min-[768px]:flex-wrap min-[768px]:justify-end">
      {(selected.routingStatus==="POSTED"?[]:inboundMailStatusActions(overrides[selected.id]?.status??selected.status)).map(action=>
       <Button key={action.status} type="button" className="w-full min-h-11 min-[768px]:w-auto min-[768px]:min-h-9" variant={action.status==="RESOLVED"?"primary":"secondary"} disabled={busy} onClick={()=>void change(selected,action.status)}>
        {busy?"Saving…":action.label}
       </Button>)}
     </div>
    </div>}>
    <dl className="grid min-w-0 gap-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)] text-sm min-[768px]:grid-cols-2">
     <div className="min-w-0"><dt className="font-semibold">From</dt><dd className="m-0 break-all">{selected.fromAddress}</dd></div>
     <div className="min-w-0"><dt className="font-semibold">To</dt><dd className="m-0 break-all">{selected.toAddress}</dd></div>
     <div className="min-w-0 min-[768px]:col-span-2"><dt className="font-semibold">Received</dt><dd className="m-0">{new Date(selected.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</dd></div>
    </dl>
    <section className="mt-[var(--lms-space-4)] min-w-0">
     <h3 className="text-sm font-semibold text-[var(--lms-heading)]">Plain text message</h3>
     <p className="mt-[var(--lms-space-2)] max-w-prose whitespace-pre-wrap break-words text-sm text-body leading-[22px]">{selected.bodyPlain}</p>
    </section>
   </Drawer>:null}
 </div>;
}
