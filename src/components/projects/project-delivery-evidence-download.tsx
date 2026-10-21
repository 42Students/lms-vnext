"use client";
import { useState } from "react";
import { isSafeSignedUrl } from "@/modules/storage/ui-models";
import { Button } from "@/components/ui/button";

/** Migration classification, NOT authorization. A legacy key or public R2 URL
 * cannot be used directly as a download grant. Server must resolve the
 * exact tenant/project owner and mint a registered, verified file ID first.
 */
export function legacyProjectDeliveryEvidenceState(
 legacyReference:string|null|undefined,
 fileId:string|null|undefined,
):"READY"|"MIGRATION_REQUIRED"|"UNAVAILABLE" {
 if(fileId&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileId))
  return "READY";
 if(!legacyReference || legacyReference.length>2048 || /[\\x00-\\x1f\\x7f\\\\]/.test(legacyReference))
  return "UNAVAILABLE";
 // Deliberately never allow a legacy URL or key to become an href.
 if(/^https:\/\//i.test(legacyReference)){
  try {
   const url=new URL(legacyReference);
   return !url.username&&!url.password&&!url.hash?"MIGRATION_REQUIRED":"UNAVAILABLE";
  }catch{return "UNAVAILABLE";}
 }
 return !legacyReference.startsWith("/")&&!legacyReference.includes("..") &&
  /^[a-zA-Z0-9_./-]+$/.test(legacyReference)?"MIGRATION_REQUIRED":"UNAVAILABLE";
}

/** Download URLs remain ephemeral and are never rendered into HTML. */
export function ProjectDeliveryEvidenceDownload({projectId,fileId,name,legacyReference}:{
  projectId:string;fileId:string|null;name:string;legacyReference?:string|null;
}) {
  const evidenceState=legacyProjectDeliveryEvidenceState(legacyReference,fileId);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function download() {
    if(busy||evidenceState!=="READY"||!fileId)return;
    setBusy(true);setError(null);
    try {
      const response=await fetch(
        "/api/projects/"+encodeURIComponent(projectId)+"/resource-files/"+
        encodeURIComponent(fileId)+"/download-grant",
        {method:"POST",credentials:"same-origin",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({disposition:"attachment"})},
      );
      if(!response.ok)throw new Error("Could not open this attachment. Please retry.");
      const payload:unknown=await response.json();
      const url=payload&&typeof payload==="object"&&"grant" in payload
        &&payload.grant&&typeof payload.grant==="object"&&"url" in payload.grant
        &&typeof payload.grant.url==="string" ? payload.grant.url : null;
      if(!url||!isSafeSignedUrl(url))throw new Error("This attachment is not available for download.");
      window.location.assign(url);
    } catch(caught) {
      setError(caught instanceof Error?caught.message:"Could not open this attachment. Please retry.");
    } finally {setBusy(false);}
  }
  return <span className="inline-flex flex-col items-start gap-1">
    {evidenceState==="READY"?<Button variant="secondary" disabled={busy}
      onClick={()=>void download()}>{busy?"Opening file…":"Open attachment · "+name}</Button>
     : <span role="status" className="text-xs text-muted-foreground">
      {evidenceState==="MIGRATION_REQUIRED"
       ?"Legacy attachment needs verification before download."
       :"This attachment is not available for download."}
     </span>}
    {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
  </span>;
}
