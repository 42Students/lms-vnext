import {redirect} from "next/navigation";

/** Preserve old summary deep links through the scoped canonical resolver. */
export default async function LegacyAdminWorkspaceSummary({params}:{
 params:Promise<{workspaceId:string}>;
}){
 const {workspaceId}=await params;
 redirect("/admin/projects/"+encodeURIComponent(workspaceId));
}
