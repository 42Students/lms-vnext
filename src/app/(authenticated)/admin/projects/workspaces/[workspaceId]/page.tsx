import {redirect} from "next/navigation";

/** Compatibility for legacy Super Admin workspaces. The canonical page
 * resolves old numeric IDs or slugs ONLY inside the selected college. */
export default async function LegacyAdminWorkspaceRoute({params}:{
 params:Promise<{workspaceId:string}>;
}){
 const {workspaceId}=await params;
 redirect("/admin/projects/"+encodeURIComponent(workspaceId));
}
