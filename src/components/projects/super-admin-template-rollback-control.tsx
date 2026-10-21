"use client";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import {useToast} from "@/components/ui/toast";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import styles from "./legacy-project-touch-actions.module.css";
export function SuperAdminTemplateRollbackControl({templateId,selectedVersion,
 currentVersion,status,impact}:{templateId:string;selectedVersion:{
  id:string;version:number;title:string};
 currentVersion:number;status:string;impact:{
  expectedTemplateVersion:number;assignedCollegeCount:number;pinnedWorkspaceCount:number;
  existingWorkspacesRewritten:number;publishedVersionUnchanged:number|null;
  lifecycleUnchanged:string;
 }}){
 const router=useRouter();
 const {showToast}=useToast();
 const {askConfirm,dialog}=useConfirmFlow();
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [reviewed,setReviewed]=useState(false);
 const enabled=selectedVersion.version!==currentVersion&&status!=="ARCHIVED"&&
   impact.expectedTemplateVersion===currentVersion;
 async function rollback(){
  if(!enabled||busy||!reviewed)return;
  if(!(await askConfirm("Roll back to this version? "+
   "A new editable version "+(currentVersion+1)+" will be created. "+
   "Unlike the old LMS, lifecycle and publication state are managed separately: "+
   "the currently published version and existing pinned workspaces will not change. "+
   "Publish the new version separately when it is ready.")))return;
  setBusy(true);setError("");
  try{
   const r=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId)+
    "/rollback","POST",{versionId:selectedVersion.id,expectedTemplateVersion:currentVersion,
      confirmed:true}) as {version:{version:number}};
   setNotice("Template rolled back to version "+selectedVersion.version+
    " as new version "+r.version.version+".");
   showToast({tone:"success",title:"Template rolled back",
     description:"Version "+r.version.version+" has been created. Publish it separately if needed."});
   router.push("/admin/projects/templates/"+encodeURIComponent(templateId)+
     "/versions?restoredVersion="+encodeURIComponent(String(r.version.version)));
   router.refresh();
  }catch(cause){
   const reason=cause instanceof Error?cause.message:"Failed to roll back template";
   setError(reason);
   showToast({tone:"error",title:"Failed to roll back template",
     description:reason+" Refresh the comparison and retry if the template version changed."});
  }
  finally{setBusy(false);}
 }
 return <div className={"min-w-0 space-y-3 border-b border-border pb-4 text-body "+styles.legacy}>
  <h2 className="text-sm font-semibold text-foreground">Restore this snapshot</h2>
  <p className="text-xs text-body">Review the compared changes above. Rollback creates a new editable version;
   assigned colleges and existing workspaces keep their current pinned versions.
   Unlike the old LMS snapshot rollback, this does not restore published,
   archived or deleted state. Publish the new revision separately.</p>
  <dl className="grid gap-2 border-y border-border py-3 text-sm sm:grid-cols-2">
    {([
      ["Assigned colleges",impact.assignedCollegeCount],
      ["Workspaces pinned to a version",impact.pinnedWorkspaceCount],
      ["Existing workspaces changed now",impact.existingWorkspacesRewritten],
      ["Published version retained",impact.publishedVersionUnchanged??"None"],
    ] as const).map(([label,value])=><div key={label}>
      <dt className="text-xs text-body">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>
  <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-body">
    <input type="checkbox" checked={reviewed} disabled={!enabled||busy}
      onChange={event=>setReviewed(event.target.checked)}
      className="size-4 accent-[var(--lms-primary)]"/>
    I reviewed these changes
  </label>
  <p className="text-xs text-muted-foreground">
    Review is tied to this template, selected snapshot and current version.
    If someone publishes another version before you confirm, the server must reject
    the stale expectedTemplateVersion rather than silently accept a different diff.
  </p>
  <Button variant="secondary" type="button" disabled={!enabled||busy||!reviewed} onClick={()=>void rollback()}
   className="min-h-11 w-full sm:min-h-9 sm:w-auto">
   {busy?"Rolling back…":"Roll back"}
  </Button>
  {status==="ARCHIVED"?<Banner tone="warning">Archived templates cannot be rolled back.</Banner>:null}
  {selectedVersion.version===currentVersion?<p className="text-xs text-muted-foreground">This is already the current version.</p>:null}
  {error?<Banner tone="error">{error}</Banner>:null}
  {notice?<Banner tone="success">{notice}</Banner>:null}
   {dialog}
 </div>;
}