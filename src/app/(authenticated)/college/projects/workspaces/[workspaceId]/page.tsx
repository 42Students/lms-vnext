import { redirect } from "next/navigation";
import { legacyWorkspaceSummaryQuery } from "@/modules/projects/legacy-workspace-summary-query";

/** Existing bookmarks, including deep-linked template prompts, remain usable. */
export default async function LegacyCollegeWorkspaceRedirect({
  params,searchParams,
}: {
  params: Promise<{workspaceId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const {workspaceId}=await params;
  const query=await searchParams;
  const suffix=legacyWorkspaceSummaryQuery(query);
  const next="/college/projects/"+encodeURIComponent(workspaceId)+"/summary";
  redirect(next+(suffix?"?"+suffix:""));
}
