import {getCurrentRequestContext} from "@/auth/request-context";
import {listProjectFiles} from "@/modules/projects/project-resource-file-service";
import {ProjectResourceFilesPanel} from "./project-resource-files-panel";

/** Server-authoritative file projection; only READY is returned to learners. */
export async function ProjectResourceFilesSection({projectId,mode,status,currentMembershipId}:{
  projectId:string;mode:"LEARNER"|"MENTOR"|"ADMIN";status:string;currentMembershipId:string|null;
}){
  const context=await getCurrentRequestContext();
  const files=await listProjectFiles(context,projectId);
  const canManage=mode!=="LEARNER"&&status!=="ARCHIVED"&&status!=="COMPLETED"&&
    Boolean(currentMembershipId);
  const canUpload=Boolean(currentMembershipId)&&
    (canManage||(mode==="LEARNER"&&status==="ACTIVE"));
  return <ProjectResourceFilesPanel projectId={projectId} initialFiles={files}
    canManage={canManage} canUpload={canUpload}/>;
}
