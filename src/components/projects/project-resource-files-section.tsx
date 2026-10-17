import {getCurrentRequestContext} from "@/auth/request-context";
import {listProjectFiles} from "@/modules/projects/project-resource-file-service";
import {ProjectResourceFilesPanel} from "./project-resource-files-panel";

/** Server-authoritative file projection; only READY is returned to learners. */
export async function ProjectResourceFilesSection({projectId,mode,status,currentMembershipId,resources=[]}:{
  projectId:string;mode:"LEARNER"|"MENTOR"|"ADMIN";status:string;currentMembershipId:string|null;
  resources?:readonly {id:string;title:string;visibility:string}[];
}){
  const context=await getCurrentRequestContext();
  const files=await listProjectFiles(context,projectId);
  const canManage=mode!=="LEARNER"&&status!=="ARCHIVED"&&status!=="COMPLETED"&&
    Boolean(currentMembershipId);
  const canUpload=Boolean(currentMembershipId)&&
    (canManage||(mode==="LEARNER"&&status==="ACTIVE"));
  const eligibleResources=resources.filter(row=>mode!=="LEARNER"||row.visibility==="TEAM")
    .map(({id,title})=>({id,title}));
  return <ProjectResourceFilesPanel projectId={projectId} initialFiles={files} resources={eligibleResources}
    canManage={canManage} canUpload={canUpload}/>;
}
