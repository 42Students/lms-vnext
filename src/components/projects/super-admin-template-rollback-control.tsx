"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
export function SuperAdminTemplateRollbackControl({templateId,selectedVersion,
 currentVersion,status}:{templateId:string;selectedVersion:{
  id:string;version:number;title:string};
 currentVersion:number;status:string}){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const enabled=selectedVersion.version!==currentVersion&&status!=="ARCHIVED";
 async function rollback(){
  if(!enabled||busy)return;
  if(!window.confirm("Roll back to version "+selectedVersion.version+"? "+
   "This creates version "+(currentVersion+1)+" from the older snapshot. "+
   "Existing workspaces and the published version are unchanged until you publish again."))return;
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
 return <div className="space-y-2 border-b border-border pb-5">
  <h2 className="text-sm font-semibold">Restore this snapshot</h2>
  <p className="text-xs text-body">Review the compared changes above. Rollback creates a new editable version;
   assigned colleges and existing workspaces keep their current pinned versions.</p>
  <Button variant="secondary" type="button" disabled={!enabled||busy} onClick={()=>void rollback()}
   className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
   {busy?"Rolling back…":"Roll back"}
  </Button>
  {status==="ARCHIVED"?<p className="text-xs text-warning-text">Archived templates cannot be rolled back.</p>:null}
  {selectedVersion.version===currentVersion?<p className="text-xs text-muted-foreground">This is already the current version.</p>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-success">{notice}</p>:null}
 </div>;
}