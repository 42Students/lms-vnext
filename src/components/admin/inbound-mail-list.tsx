"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Drawer} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {safeInboundPreview} from "@/modules/inbound-mail/message-model";
import {createInboundMailTriageGate} from "@/modules/inbound-mail/triage-submit-model";
import {inboundMailStatusActions,type InboundMailStatus} from "@/modules/inbound-mail/triage-transition-model";
export type InboundMailRow={
 id:string;receivedAt:string;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;version:number;
};
export function InboundMailList({rows}:{rows:readonly InboundMailRow[]}) {
 const router=useRouter();
 const [selected,setSelected]=useState<InboundMailRow|null>(null);
 const [overrides,setOverrides]=useState<Record<string,{status:string;version:number}>>({});
 const [busy,setBusy]=useState(false);
 const triageGate=useRef(createInboundMailTriageGate());
 const [message,setMessage]=useState("");
 async function change(row:InboundMailRow,status:InboundMailStatus){
  if(!triageGate.current.tryBegin())return;
  const current=overrides[row.id]??row;
  setBusy(true);setMessage("");
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
   setMessage(status==="RESOLVED"?"Message marked done.":status==="TRIAGED"?"Message marked being handled.":"Message moved back to To read.");
   router.refresh();
  }catch(error){setMessage(error instanceof Error&&error.name==="AbortError"?"Request timed out. Refresh the inbox before trying again.":error instanceof Error?error.message:"Could not update message status.");}
  finally{window.clearTimeout(timeout);triageGate.current.end();setBusy(false);}
 }

 return <div className="min-w-0 space-y-3">
  {rows.length===0?<p role="status" className="border-y border-border py-4 text-sm text-body">No inbound messages match these filters.</p>:
   <div className="min-w-0 divide-y divide-border border-y border-border">
    {rows.map(row=><article key={row.id} className="min-w-0 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <h2 className="min-w-0 break-words text-base font-semibold text-foreground">{row.subject||"(No subject)"}</h2>
       <StatusBadge>{({NEW:"To read",TRIAGED:"Being handled",RESOLVED:"Done"} as Record<string,string>)[overrides[row.id]?.status??row.status]??"Unknown status"}</StatusBadge>
      </div>
      <p className="mt-1 break-all text-sm text-body">From {row.fromAddress} · To {row.toAddress}</p>
      <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground print:line-clamp-none">{safeInboundPreview(row.bodyPlain)}</p>
      <p className="mt-1 text-xs text-muted-foreground">Sender identity and conversation-routing status are not verified by this inbox.</p>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(row.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
      <Button type="button" variant="secondary" className="mt-3 min-h-11 md:min-h-9 print:hidden" onClick={()=>{setMessage("");setSelected(row);}}>Read message</Button>
    </article>)}
   </div>}
  {selected?<Drawer open onOpenChange={open=>{if(!open)setSelected(null)}} title={selected.subject||"(No subject)"}
    description="Private inbound message">
    <dl className="grid min-w-0 gap-3 text-sm">
     <div><dt className="font-semibold">From</dt><dd className="m-0 break-all">{selected.fromAddress}</dd></div>
     <div><dt className="font-semibold">To</dt><dd className="m-0 break-all">{selected.toAddress}</dd></div>
     <div><dt className="font-semibold">Received</dt><dd className="m-0">{new Date(selected.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</dd></div>
    </dl>
    <div className="mt-4 flex flex-wrap gap-2">
     {inboundMailStatusActions(overrides[selected.id]?.status??selected.status).map(action=>
      <Button key={action.status} type="button" className="min-h-11 md:min-h-9" variant={action.status==="RESOLVED"?"primary":"secondary"} disabled={busy} onClick={()=>void change(selected,action.status)}>
       {busy?"Saving…":action.label}
      </Button>)}
    </div>
    {message?<p role="status" className="mt-3 text-sm text-body">{message}</p>:null}
    <section className="mt-5 min-w-0 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Plain text message</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{selected.bodyPlain.slice(0,15000)}</p>
      {selected.bodyPlain.length>15000?<p className="text-xs text-muted-foreground">Message preview truncated after 15,000 characters.</p>:null}
    </section>
   </Drawer>:null}
 </div>;
}
