"use client";

import {useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";

type SummaryItem={signatureHash:string;occurrenceCount:string;muted:boolean;
  fixStatus:string;regressedAt:Date|null;firstSeenAt:Date};
export function TrackerTelegramManualPanel({items,configured,deploy}:{
  items:readonly SummaryItem[];configured:boolean;deploy:string|null;
}){
  const [open,setOpen]=useState(false);
  const [confirm,setConfirm]=useState<"TEST"|"DIGEST"|null>(null);
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState(false);
  async function send(kind:"TEST"|"DIGEST"){
    if(pending)return;
    setPending(true);setNotice("");setError(false);
    try{
      const result=await apiFetch<{message:string}>("/api/tracker/logs/manual-alert",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({kind}),
      });
      setNotice(result.message);setOpen(false);setConfirm(null);
    }catch(caught){
      setError(true);
      setNotice(caught instanceof FriendlyFetchError?caught.message:
        "Could not send the alert. Try again later.");
    }finally{setPending(false);}
  }
  const regressions=items.filter(item=>item.regressedAt).length;
  const fixed=items.filter(item=>item.fixStatus==="FIXED").length;
  const muted=items.filter(item=>item.muted).length;
  return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold">Telegram alerts</h2>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={!configured||pending} onClick={()=>setOpen(true)}
        className="min-h-10 rounded border border-border px-3 text-sm font-semibold disabled:opacity-50">
        Daily digest
      </button>
      <button type="button" disabled={!configured||pending} onClick={()=>setConfirm("TEST")}
        className="min-h-10 rounded border border-border px-3 text-sm font-semibold disabled:opacity-50">
        Send test alert
      </button>
    </div>
    {!configured?<p role="status" className="text-sm text-body">
      Telegram alerts are not configured. Manual sends are unavailable.
    </p>:null}
    {notice?<p role={error?"alert":"status"} className="text-sm text-body">{notice}</p>:null}
    <Dialog open={open} onOpenChange={setOpen} title="Daily digest"
      description="This preview covers the latest visible Known Errors only. The sent digest uses up to 100 signatures.">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt>Regressions</dt><dd className="font-semibold">{regressions}</dd></div>
        <div><dt>Marked fixed</dt><dd className="font-semibold">{fixed}</dd></div>
        <div><dt>Muted types</dt><dd className="font-semibold">{muted}</dd></div>
        <div><dt>New error types in this window</dt><dd className="font-semibold">{items.length}</dd></div>
        <div><dt>Deploy</dt><dd>{deploy??"Not recorded"}</dd></div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={()=>setConfirm("DIGEST")}
          className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold">
          Send to Telegram now
        </button>
        <button type="button" onClick={()=>setOpen(false)}
          className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold">Close</button>
      </div>
    </Dialog>
    <ConfirmDialog open={confirm!==null} onOpenChange={value=>{if(!value)setConfirm(null);}}
      title={confirm==="TEST"?"Send a Telegram test alert?":"Send the daily digest to Telegram now?"}
      description="This sends one message to the configured administrator chat. Manual sends are rate-limited."
      confirmLabel={confirm==="TEST"?"Send test alert":"Send digest"}
      pending={pending}
      onConfirm={()=>{if(confirm)void send(confirm);}}/>
  </section>;
}
