"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";

import {useEffect,useRef,useState} from "react";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Drawer} from "@/components/ui/drawer";

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
  const [delivery,setDelivery]=useState<"ACCEPTED"|"UNCONFIGURED"|"RATE_LIMITED"|"FAILED"|"DENIED"|null>(null);
  const confirmAfterClose=useRef<number|null>(null);
  useEffect(()=>()=>{if(confirmAfterClose.current!==null)window.clearTimeout(confirmAfterClose.current);},[]);
  function requestDigestConfirmation(){
    setOpen(false);
    // The shared native Dialog remains in the top layer during its 180ms exit.
    if(confirmAfterClose.current!==null)window.clearTimeout(confirmAfterClose.current);
    confirmAfterClose.current=window.setTimeout(()=>{
      setConfirm("DIGEST");confirmAfterClose.current=null;
    },200);
  }
  async function send(kind:"TEST"|"DIGEST"){
    if(pending)return;
    setPending(true);setNotice("");setError(false);setDelivery(null);
    try{
      const result=await apiFetch<{message:string;accepted?:boolean;delivered?:boolean|null}>("/api/tracker/logs/manual-alert",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({kind}),
      });
      setNotice(result.accepted===true?
        "Telegram accepted the alert request. Delivery is not confirmed.":
        result.message||"Telegram acceptance was not confirmed.");
      setDelivery(result.accepted===true?"ACCEPTED":"FAILED");
      setError(result.accepted!==true);setOpen(false);setConfirm(null);
    }catch(caught){
      setError(true);
      if(caught instanceof FriendlyFetchError){
        setDelivery(caught.status===403?"DENIED":caught.status===429?"RATE_LIMITED":
          !configured?"UNCONFIGURED":"FAILED");
        setNotice(caught.status===403?"Not authorized.":
          caught.status===429?"A manual alert was sent recently. Try again in 10 minutes.":
          !configured?"Telegram alerts are not configured.":
          caught.status===503?"Telegram could not confirm delivery. Try again later.":
          caught.message||"Could not send the alert. Try again later.");
      }else{setDelivery("FAILED");setNotice("Could not send the alert. Try again later.");}
    }finally{setPending(false);}
  }
  const regressions=items.filter(item=>item.regressedAt).length;
  const fixed=items.filter(item=>item.fixStatus==="FIXED").length;
  const muted=items.filter(item=>item.muted).length;
  return <section className="min-w-0 space-y-3 border-b border-border pb-4">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Telegram alerts</h2>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>{
        if(confirmAfterClose.current!==null){window.clearTimeout(confirmAfterClose.current);confirmAfterClose.current=null;}
        setOpen(true);
       }}
       >
        Daily digest
      </Button>
      <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={!configured||pending} onClick={()=>setConfirm("TEST")}
       >
        Send test alert
      </Button>
    </div>
    {!configured?<InlineNotice tone="info" message="Telegram alerts are not configured. Manual sends are unavailable."/>:null}
    {notice&&confirm===null?<div role="status" className="space-y-1">
      <InlineNotice tone={error?"error":"success"} message={notice}/>
      {delivery==="ACCEPTED"?<p className="text-xs text-body">Provider accepted · recipient delivery unknown</p>:null}
      {delivery==="RATE_LIMITED"?<p className="text-xs text-body">Wait before sending another test or digest.</p>:null}
      {delivery==="UNCONFIGURED"?<p className="text-xs text-body">Configure Telegram before retrying.</p>:null}
    </div>:null}
    <Drawer open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title="Log digest"
      description="This preview covers the latest visible Known Errors only. The sent digest uses up to 100 signatures."
      footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
       <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={pending} onClick={()=>setOpen(false)}>Close</Button>
       <Button variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={!configured||pending} onClick={requestDigestConfirmation}>
        Send to Telegram now
       </Button>
      </div>}>
      <dl className="grid min-w-0 gap-x-4 gap-y-0 text-sm md:grid-cols-2">
        <div className="min-w-0 border-b border-border py-2"><dt className="text-xs text-muted-foreground">Regressions</dt><dd className="break-words font-semibold">{regressions}</dd></div>
        <div className="min-w-0 border-b border-border py-2"><dt className="text-xs text-muted-foreground">Marked fixed</dt><dd className="break-words font-semibold">{fixed}</dd></div>
        <div className="min-w-0 border-b border-border py-2"><dt className="text-xs text-muted-foreground">Muted types</dt><dd className="break-words font-semibold">{muted}</dd></div>
        <div className="min-w-0 border-b border-border py-2"><dt className="text-xs text-muted-foreground">New error types in this window</dt><dd className="break-words font-semibold">{items.length}</dd></div>
        <div className="min-w-0 border-b border-border py-2"><dt className="text-xs text-muted-foreground">Deploy</dt><dd className="break-all">{deploy??"Not recorded"}</dd></div>
      </dl>

    </Drawer>
    <ConfirmDialog open={confirm!==null} onOpenChange={value=>{if(!value&&!pending){setConfirm(null);setError(false);}}}
      title={confirm==="TEST"?"Send a Telegram test alert?":"Send the daily digest to Telegram now?"}
      description="This sends one message to the configured administrator chat. Manual sends are rate-limited."
      confirmLabel={confirm==="TEST"?"Send test alert":"Send digest"}
      pending={pending}
      onConfirm={()=>{if(confirm)void send(confirm);}}>
      {error&&notice?<InlineNotice tone="error" message={notice}/>:null}
    </ConfirmDialog>
  </section>;
}
