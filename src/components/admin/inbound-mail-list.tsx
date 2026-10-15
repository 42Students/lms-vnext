"use client";
import {useState} from "react";
import {Drawer} from "@/components/ui/drawer";
import {StatusBadge} from "@/components/ui/status-badge";
export type InboundMailRow={
 id:string;receivedAt:string;fromAddress:string;toAddress:string;
 subject:string;bodyPlain:string;status:string;
};
export function InboundMailList({rows}:{rows:readonly InboundMailRow[]}) {
 const [selected,setSelected]=useState<InboundMailRow|null>(null);
 return <div className="min-w-0 space-y-3">
  {rows.length===0?<p role="status" className="rounded-xl border border-border p-5">No inbound messages match these filters.</p>:
   <div className="grid min-w-0 gap-3">
    {rows.map(row=><article key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <h2 className="min-w-0 break-words text-base font-semibold">{row.subject||"(No subject)"}</h2>
       <StatusBadge>{row.status}</StatusBadge>
      </div>
      <p className="mt-1 break-all text-sm text-body">{row.fromAddress}</p>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(row.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
      <button type="button" onClick={()=>setSelected(row)}
       className="mt-3 min-h-10 rounded-md border border-border px-4 text-sm font-semibold">Read message</button>
    </article>)}
   </div>}
  {selected?<Drawer open onOpenChange={open=>{if(!open)setSelected(null)}} title={selected.subject||"(No subject)"}
    description="Private inbound message · read-only">
    <dl className="grid min-w-0 gap-3 text-sm">
     <div><dt className="font-semibold">From</dt><dd className="m-0 break-all">{selected.fromAddress}</dd></div>
     <div><dt className="font-semibold">To</dt><dd className="m-0 break-all">{selected.toAddress}</dd></div>
     <div><dt className="font-semibold">Received</dt><dd className="m-0">{new Date(selected.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</dd></div>
    </dl>
    <section className="mt-5 min-w-0 rounded-md border border-border p-4">
      <h3 className="text-sm font-semibold">Plain text message</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{selected.bodyPlain.slice(0,15000)}</p>
      {selected.bodyPlain.length>15000?<p className="text-xs text-muted-foreground">Message preview truncated after 15,000 characters.</p>:null}
    </section>
   </Drawer>:null}
 </div>;
}
