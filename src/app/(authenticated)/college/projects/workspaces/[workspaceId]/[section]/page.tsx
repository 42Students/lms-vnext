import { redirect } from "next/navigation";
import {legacyWorkspaceSummaryQuery} from "@/modules/projects/legacy-workspace-summary-query";

/** Preserve an existing workspace subsection while enforcing canonical page guards. */
export default async function LegacyCollegeWorkspaceSectionRedirect({
  params,searchParams,
}: {
  params: Promise<{ workspaceId: string; section: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const {workspaceId,section}=await params;
  const query=await searchParams;
  // The old workspace router forwards the query untouched. Use the same
  // bounded sanitizer as the parent alias so bookmarks keep template, search,
  // sorting and future non-identity state rather than silently losing them.
  const suffix=legacyWorkspaceSummaryQuery(query);
  const next="/college/projects/"+encodeURIComponent(workspaceId)+"/"+encodeURIComponent(section);
  redirect(next+(suffix?"?"+suffix:""));
}
