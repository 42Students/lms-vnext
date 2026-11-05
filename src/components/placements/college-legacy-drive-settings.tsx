"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {collegeDriveCloseAction,collegeDriveReopenAction,type CollegeLegacyDriveStatus} from
  "@/modules/placements/college-legacy-drive-settings-model";
import { Heading } from "@/components/ui/heading";

/** Deliberately excludes legacy permanent deletion: vNext only supports archive. */
export function CollegeLegacyDriveSettings({
  jobId,status,
}:{jobId:string;status:CollegeLegacyDriveStatus}) {
  const router=useRouter();
  const [confirmation,setConfirmation]=useState<"CLOSE"|"REOPEN"|null>(null);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState<string|null>(null);
  const action=collegeDriveCloseAction(status);
  const reopen=collegeDriveReopenAction(status);
  async function closeDrive() {
    if(!action||busy||confirmation!=="CLOSE")return;
    setBusy(true);
    setFeedback(null);
    try{
      const result=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/status",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:action.action}),
      });
      if(!result.ok)throw new Error("Failed to update drive status");
      setFeedback("Drive closed");
      setConfirmation(null);
      router.refresh();
    }catch{
      setFeedback("Failed to update drive status");
    }finally{
      setBusy(false);
    }
  }
  async function reopenDrive(){
    if(!reopen||busy||confirmation!=="REOPEN")return;
    setBusy(true);setFeedback(null);
    try{
      const result=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/reopen",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({confirmed:true}),
      });
      const body=await result.json().catch(()=>null);
      if(!result.ok)throw Error(body?.error??"Could not reopen drive");
      setFeedback("Drive opened");setConfirmation(null);router.refresh();
    }catch(error){setFeedback(error instanceof Error?error.message:"Could not reopen drive");}
    finally{setBusy(false);}
  }
  if(status==="DRAFT")return null;
  return <section className="min-w-0 space-y-[var(--lms-space-3)] rounded-[var(--lms-control-radius)] border border-border bg-surface p-[var(--lms-space-4)]">
    <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">Drive status</Heading>
    <StatusBadge tone={status==="PUBLISHED"?"success":"neutral"}>{status}</StatusBadge>
    {action?<div className="space-y-3">
      {confirmation==="CLOSE"?<div className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3" role="dialog" aria-modal="false" aria-label={action.confirmation}>
        <p>{action.confirmation}</p>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" disabled={busy} onClick={closeDrive}
            className="min-h-11 w-full sm:w-auto md:min-h-9">Yes</Button>
          <Button type="button" disabled={busy} onClick={()=>setConfirmation(null)}
            variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">No</Button>
        </div>
      </div>:<Button type="button" disabled={busy}
        onClick={()=>setConfirmation("CLOSE")} variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">
        {action.label}
      </Button>}
    </div>:null}
    {reopen?<div className="space-y-3">
      {confirmation==="REOPEN"?<div role="dialog" aria-modal="false" aria-label="Confirm open drive" className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
        <p>Are you sure you want to open this drive?</p>
        <p className="text-xs text-muted-foreground">{reopen.confirmation}</p>
        <Button type="button" disabled={busy} onClick={()=>void reopenDrive()}
          className="min-h-11 w-full sm:w-auto md:min-h-9">
          {busy?"Opening…":"Yes"}
        </Button>
        <Button type="button" disabled={busy} onClick={()=>setConfirmation(null)}
          variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">No</Button>
      </div>:<Button type="button" disabled={busy} onClick={()=>setConfirmation("REOPEN")}
        variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">{reopen.label}</Button>}
    </div>:null}
    {feedback?<p role="status">{feedback}</p>:null}
  </section>;
}
