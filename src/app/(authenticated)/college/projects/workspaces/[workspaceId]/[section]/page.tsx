import { redirect } from "next/navigation";

/** Preserve an existing workspace subsection while enforcing canonical page guards. */
export default async function LegacyCollegeWorkspaceSectionRedirect({
  params,searchParams,
}: {
  params: Promise<{ workspaceId: string; section: string }>;
  searchParams: Promise<{from?:string|string[];reason?:string|string[]}>;
}) {
  const {workspaceId,section}=await params;
  const query=await searchParams;
  const from=typeof query.from==="string"&&["workspaces","at-risk","submissions"].includes(query.from)?query.from:null;
  const reason=typeof query.reason==="string"&&/^(STALLED|BLOCKER|REVIEW)$/i.test(query.reason)?query.reason.toUpperCase():null;
  const suffix=new URLSearchParams();
  if(from&&from!=="workspaces")suffix.set("from",from);
  if(reason)suffix.set("reason",reason);
  const next="/college/projects/"+encodeURIComponent(workspaceId)+"/"+encodeURIComponent(section);
  redirect(next+(suffix.size?"?"+suffix.toString():""));
}
