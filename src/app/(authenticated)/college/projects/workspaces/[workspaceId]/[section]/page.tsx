import { redirect } from "next/navigation";

/** Preserve an existing workspace subsection while enforcing canonical page guards. */
export default async function LegacyCollegeWorkspaceSectionRedirect({
  params,searchParams,
}: {
  params: Promise<{ workspaceId: string; section: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const {workspaceId,section}=await params;
  const query=await searchParams;
  const from=typeof query.from==="string"&&["workspaces","at-risk","submissions"].includes(query.from)?query.from:null;
  const reason=typeof query.reason==="string"&&query.reason.length<=240&&
    !/[<>\x00-\x1f]/.test(query.reason)?query.reason:null;
  const suffix=new URLSearchParams();
  if(from&&from!=="workspaces")suffix.set("from",from);
  if(reason)suffix.set("reason",reason);
  if(query.openTemplate==="1"&&section==="summary")suffix.set("openTemplate","1");
  // Preserve bounded view context for existing bookmarked workspace aliases.
  for(const name of ["q","filter","status","sort","page"] as const){
    const value=query[name];
    if(typeof value==="string"&&value.length<=120&&!/[\x00-\x1f]/.test(value))
      suffix.set(name,value);
  }
  const next="/college/projects/"+encodeURIComponent(workspaceId)+"/"+encodeURIComponent(section);
  redirect(next+(suffix.size?"?"+suffix.toString():""));
}
