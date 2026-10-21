"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {apiFetch} from "@/lib/api-fetch";

type Entry={key:string;value:string;version:number};

/** ORG overrides are historical only. Viewing/removing a stored key is
 * permitted after persisted organization authorization; creating or editing
 * one is deliberately not exposed in this panel.
 */
export function OrganizationSettingsCleanup({organizationId,ready,entries}:{
 organizationId:string;ready:boolean;entries:readonly Entry[];
}){
 const router=useRouter();
 const [target,setTarget]=useState<Entry|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function remove(){
  if(!target||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   await apiFetch("/api/admin/settings/overrides",{
    method:"DELETE",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({scopeType:"ORG",organizationId,
      key:target.key,expectedVersion:target.version}),
   });
   setNotice("Historical override removed. The runtime configuration was not changed.");
   setTarget(null);router.refresh();
  }catch{
   setError("Could not remove this key. Refresh the organization settings and retry.");
   setTarget(null);
  }finally{setBusy(false);}
 }
 return <section aria-label="Historical organization setting cleanup"
  className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h2 className="font-semibold text-foreground">Organization settings · historical overrides</h2>
  <p className="text-sm text-body">These unused organization keys do not affect running settings. No new ORG overrides can be created here. Deletion is audited and cannot be undone from this screen.</p>
  {!ready?<p role="status" className="text-sm text-warning-text">Historical organization setting storage is unavailable. Nothing was changed.</p>:
    entries.length===0?<p role="status" className="text-sm text-body">No stored organization-level overrides remain.</p>:
    <div className="overflow-x-auto"><table className="w-full min-w-[480px] border-collapse text-left text-sm">
     <thead><tr className="border-b border-border text-muted-foreground">
      <th scope="col" className="p-2">Key</th>
      <th scope="col" className="p-2">Historical value</th>
      <th scope="col" className="p-2">Version</th>
      <th scope="col" className="p-2">Action</th>
     </tr></thead>
     <tbody>{entries.map(entry=><tr key={entry.key} className="border-b border-border">
       <th scope="row" className="break-all p-2 font-semibold">{entry.key}</th>
       <td className="max-w-[240px] break-all p-2">{entry.value}</td>
       <td className="p-2 tabular-nums">{entry.version}</td>
       <td className="p-2"><Button type="button" size="sm" variant="secondary"
        disabled={busy} onClick={()=>{setTarget(entry);setError("");}}>
        Remove
       </Button></td>
      </tr>)}</tbody>
    </table></div>}
  {error?<InlineNotice tone="error" message={error}/>:null}
  {notice?<InlineNotice tone="success" message={notice}/>:null}
  <ConfirmDialog open={target!==null}
   onOpenChange={next=>{if(!next&&!busy)setTarget(null);}}
   title={"Remove historical ORG key"+(target?" "+target.key:"")+"?"}
   description="Remove the stored, unused organization setting. This has no effect on running configuration, and the operation will be audited."
   confirmLabel="Remove unused key" confirmVariant="danger" pending={busy}
   onConfirm={()=>{void remove();}}/>
 </section>;
}
