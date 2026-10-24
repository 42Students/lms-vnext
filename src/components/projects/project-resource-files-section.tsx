import {getCurrentRequestContext} from "@/auth/request-context";
import {listProjectFiles} from "@/modules/projects/project-resource-file-service";
import {ProjectResourceFilesPanel} from "./project-resource-files-panel";
import {canManageProjectFilePanel,canUploadProjectFilePanel}
  from "@/modules/projects/mentor-file-panel-role-model";

/** Server-authoritative file projection; only READY is returned to learners. */
export async function ProjectResourceFilesSection({projectId,mode,status,currentMembershipId,readOnly,resources=[]}:{
  projectId:string;mode:"LEARNER"|"MENTOR"|"ADMIN";status:string;currentMembershipId:string|null;
  readOnly:boolean;
  resources?:readonly {id:string;title:string;visibility:string;status:string;updatedAt:string}[];
}){
  const context=await getCurrentRequestContext();
  const files=await listProjectFiles(context,projectId);
  const fileRole={mode,status,readOnly,hasMembership:Boolean(currentMembershipId)};
  const canManage=canManageProjectFilePanel(fileRole);
  const canUpload=canUploadProjectFilePanel(fileRole);
  const eligibleResources=resources.filter(row=>mode==="LEARNER"?
    row.status==="ACTIVE"&&row.visibility==="TEAM":
    (row.status==="ACTIVE"||row.status==="DRAFT"))
    .map(({id,title,status,updatedAt})=>({id,title,status,updatedAt}));
  return <ProjectResourceFilesPanel projectId={projectId} initialFiles={files} resources={eligibleResources}
    canManage={canManage} canUpload={canUpload}/>;
}
