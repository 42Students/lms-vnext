import { redirect } from "next/navigation";

/** Existing bookmarks, including deep-linked template prompts, remain usable. */
export default async function LegacyCollegeWorkspaceRedirect({
  params,searchParams,
}: {
  params: Promise<{workspaceId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const {workspaceId}=await params;
  const query=await searchParams;
  const suffix=new URLSearchParams();
  for(const name of ["from","reason","openTemplate","q","filter","status","sort","page"] as const){
    const value=query[name];
    if(typeof value==="string"&&value.length<=240&&!/[<>\x00-\x1f]/.test(value)){
      if(name==="openTemplate"&&value!=="1")continue;
      suffix.set(name,value);
    }
  }
  const next="/college/projects/"+encodeURIComponent(workspaceId)+"/summary";
  redirect(next+(suffix.size?"?"+suffix.toString():""));
}
