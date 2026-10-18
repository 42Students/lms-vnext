"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
export function SuperAdminTemplateArchiveControl({templateId,title,status}:{
 templateId:string;title:string;status:string;
}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 if(status==="ARCHIVED")return <span className="text-xs text-muted-foreground">Archived</span>;
 async function archive(){
  if(!window.confirm("Archive template \""+title+"\"? Existing workspaces keep their pinned snapshot. This template will no longer be available for new assignments."))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"DELETE");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to archive template");}
  finally{setBusy(false);}
 }
 return <span><button type="button" disabled={busy} onClick={()=>void archive()}
    className="text-xs">
    {busy?"Archiving…":"Archive"}</button>
    {error?<span role="alert" className="block text-xs text-error">{error}</span>:null}
  </span>;
}
