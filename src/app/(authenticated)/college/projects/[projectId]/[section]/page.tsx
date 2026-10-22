import {CollegeProjectDeliveryOverview} from "@/components/projects/college-project-delivery-overview";
import { AdminProjectSectionPage } from "@/components/projects/admin-project-section-page";

export default async function CollegeProjectSectionRoute({
  params,searchParams,
}: {
  params: Promise<{projectId:string;section:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const {projectId,section}=await params;
  const query=await searchParams;
  const from=typeof query["from"]==="string"&&["at-risk","submissions","workspaces"].includes(query["from"])
    ?query["from"]:undefined;
  const reason=typeof query["reason"]==="string"&&query["reason"].length<=240&&
    !/[<>\x00-\x1f]/.test(query["reason"])?query["reason"]:undefined;
  if(section==="delivery")return <CollegeProjectDeliveryOverview projectId={projectId}/>;
  return <AdminProjectSectionPage
    projectId={projectId} section={section} basePath="/college/projects"
    {...(from!==undefined?{from}:{})} {...(reason!==undefined?{reason}:{})}/>;
}
