"use client";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import styles from "./legacy-project-touch-actions.module.css";
export function SuperAdminTemplateArchiveControl({templateId,title,status}:{
 templateId:string;title:string;status:string;
}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const {askConfirm,dialog}=useConfirmFlow();

 async function archive(){
  if(!(await askConfirm("Archive template \""+title+"\"? Existing workspaces keep their pinned snapshot. This template will no longer be available for new assignments.")))return;
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"DELETE");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to archive template");}
  finally{setBusy(false);}
 }
 return <div className={styles.legacy+" "+styles.contents}><span><Button type="button" variant="secondary" disabled={busy||status==="ARCHIVED"} onClick={()=>void archive()}
    className="border-red-300 text-red-700 hover:bg-red-50">
    {busy?"Archiving…":status==="ARCHIVED"?"Archived":"▣ Archive"}</Button>
    </span>{error?<Banner tone="error">{error}</Banner>:null}{dialog}</div>;
}
