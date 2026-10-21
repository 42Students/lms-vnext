import {redirect} from "next/navigation";

/** Preserve legacy lesson-content links while keeping separate vNext workspaces. */
export default async function LegacyCollegeLessonContentPage({
  searchParams,
}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const params=await searchParams;
  const type=Array.isArray(params.type)?params.type[0]:params.type;
  const path=type==="resources"?"/college/resources":
    type==="live-classes"?"/college/live-classes":"/college/videos";
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(params)){
    if(key==="type")continue;
    const item=Array.isArray(value)?value[0]:value;
    if(typeof item==="string")query.set(key,item);
  }
  const suffix=query.toString();
  redirect(path+(suffix?"?"+suffix:""));
}
