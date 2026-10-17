"use client";
import { useState } from "react";
import { isSafeSignedUrl } from "@/modules/storage/ui-models";
import { Button } from "@/components/ui/button";

/** Download URLs remain ephemeral and are never rendered into HTML. */
export function ProjectDeliveryEvidenceDownload({projectId,fileId,name}:{
  projectId:string;fileId:string;name:string;
}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function download() {
    if(busy)return;
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
    <Button size="sm" variant="secondary" disabled={busy}
      onClick={()=>void download()}>{busy?"Opening file…":"Open attachment · "+name}</Button>
    {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
  </span>;
}
