"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {collegeDriveCloseAction,collegeDriveReopenAction,type CollegeLegacyDriveStatus} from
  "@/modules/placements/college-legacy-drive-settings-model";

/** Deliberately excludes legacy permanent deletion: vNext only supports archive. */
export function CollegeLegacyDriveSettings({
  jobId,status,
}:{jobId:string;status:CollegeLegacyDriveStatus}) {
  const router=useRouter();
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState<string|null>(null);
  const action=collegeDriveCloseAction(status);
  const reopen=collegeDriveReopenAction(status);
  async function closeDrive() {
    if(!action||busy||!confirm)return;
    setBusy(true);
    setFeedback(null);
    try{
      const result=await fetch("/api/placements/jobs/"+encodeURIComponent(jobId)+"/status",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({action:action.action}),
      });
      if(!result.ok)throw new Error("Failed to update drive status");
      setFeedback("Drive closed");
      setConfirm(false);
      router.refresh();
    }catch{
      setFeedback("Failed to update drive status");
    }finally{
      setBusy(false);
    }
  }
  async function reopenDrive(){
    if(!reopen||busy||!confirm)return;
    setBusy(true);setFeedback(null);
    try{
      const result=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/reopen",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({confirmed:true}),
      });
      const body=await result.json().catch(()=>null);
      if(!result.ok)throw Error(body?.error??"Could not reopen drive");
      setFeedback("Job opened successfully");setConfirm(false);router.refresh();
    }catch(error){setFeedback(error instanceof Error?error.message:"Could not reopen drive");}
    finally{setBusy(false);}
  }
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold">Drive status</h2>
    <p className="font-medium">{status}</p>
    {action?<div className="space-y-3">
      {confirm?<div className="space-y-3" role="group" aria-label={action.confirmation}>
        <p>{action.confirmation}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={closeDrive}
            className="min-h-10 rounded-md bg-primary px-4 text-on-primary">Yes</button>
          <button type="button" disabled={busy} onClick={()=>setConfirm(false)}
            className="min-h-10 rounded-md border px-4">No</button>
        </div>
      </div>:<button type="button" disabled={busy}
        onClick={()=>setConfirm(true)} className="min-h-10 rounded-md border px-4">
        {action.label}
      </button>}
    </div>:null}
    {reopen?<div className="space-y-3">
      {confirm?<div role="group" aria-label={reopen.confirmation} className="space-y-3">
        <p>{reopen.confirmation}</p>
        <button type="button" disabled={busy} onClick={()=>void reopenDrive()}
          className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">
          {busy?"Reopening…":"Yes, reopen"}
        </button>
        <button type="button" disabled={busy} onClick={()=>setConfirm(false)}
          className="ml-2 min-h-10 rounded border border-border px-4">Cancel</button>
      </div>:<button type="button" disabled={busy} onClick={()=>setConfirm(true)}
        className="min-h-10 rounded border border-border px-4">{reopen.label}</button>}
    </div>:null}
    {feedback?<p role="status">{feedback}</p>:null}
  </section>;
}
