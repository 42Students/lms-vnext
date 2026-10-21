"use client";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import { useToast } from "@/components/ui/toast";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import styles from "./legacy-project-touch-actions.module.css";
export function SuperAdminTemplateArchiveControl({templateId,title,status}:{
 templateId:string;title:string;status:string;
}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();
 const {showToast}=useToast();
 if(status==="ARCHIVED")return <StatusBadge tone="neutral">Archived</StatusBadge>;
 async function archive(){
  if(!(await askConfirm("Archive template \""+title+"\"? Existing workspaces keep their pinned snapshot. This template will no longer be available for new assignments.")))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"DELETE");
   showToast({tone:"success",title:"Template archived"});
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Failed to archive template");}
  finally{setBusy(false);}
 }
 return <div className={styles.legacy+" "+styles.contents}><span><Button type="button" variant="secondary" disabled={busy} onClick={()=>void archive()}
    className="">
    {busy?"Archiving…":"Archive"}</Button>
    </span>{error?<Banner tone="error">{error}</Banner>:null}{dialog}</div>;
}
