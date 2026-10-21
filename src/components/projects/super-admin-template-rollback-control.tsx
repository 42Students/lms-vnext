"use client";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import styles from "./legacy-project-touch-actions.module.css";
export function SuperAdminTemplateRollbackControl({templateId,selectedVersion,
 currentVersion,status}:{templateId:string;selectedVersion:{
  id:string;version:number;title:string};
 currentVersion:number;status:string}){
 const router=useRouter();
 const {askConfirm,dialog}=useConfirmFlow();
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [reviewed,setReviewed]=useState(false);
 const enabled=selectedVersion.version!==currentVersion&&status!=="ARCHIVED";
 async function rollback(){
  if(!enabled||busy||!reviewed)return;
  if(!(await askConfirm("Roll back to version "+selectedVersion.version+"? "+
   "This creates version "+(currentVersion+1)+" from the older snapshot. "+
   "Existing workspaces and the published version are unchanged until you publish again.")))return;
  setBusy(true);setError("");
  try{
   const r=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId)+
    "/rollback","POST",{versionId:selectedVersion.id,expectedTemplateVersion:currentVersion,
      confirmed:true}) as {version:{version:number}};
   setNotice("Template rolled back to version "+selectedVersion.version+
    " as new version "+r.version.version+".");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Template rollback failed.");}
  finally{setBusy(false);}
 }
 return <div className={"min-w-0 space-y-3 border-b border-border pb-4 text-body "+styles.legacy}>
  <h2 className="text-sm font-semibold text-foreground">Restore this snapshot</h2>
  <p className="text-xs text-body">Review the compared changes above. Rollback creates a new editable version;
   assigned colleges and existing workspaces keep their current pinned versions.</p>
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