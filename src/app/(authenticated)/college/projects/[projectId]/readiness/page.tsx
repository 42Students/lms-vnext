import {ProjectWorkspaceReadiness} from "@/components/projects/project-workspace-readiness";
export default async function Page({params}:{params:Promise<{projectId:string}>}){
  const {projectId}=await params;
  return <ProjectWorkspaceReadiness projectId={projectId} basePath="/college/projects"/>;
}
