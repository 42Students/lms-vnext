"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {collegeDriveCloseAction,type CollegeLegacyDriveStatus} from
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
    {feedback?<p role="status">{feedback}</p>:null}
  </section>;
}
