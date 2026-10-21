import { redirect } from "next/navigation";

/** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const source=await searchParams;
 const allowed=["q","status","page","pageSize","view"] as const;
 const target=new URLSearchParams();
 for(const key of allowed){
  const value=source[key];
  if(typeof value==="string"&&value.length<=120){
   if(key==="status"&&!["ALL","ACTIVE","ARCHIVED","COMPLETED","PAUSED"].includes(value))continue;
   if(key==="view"&&!["cards","table"].includes(value))continue;
   target.set(key,value);
  }
 }
 redirect("/college/projects"+(target.size?"?"+target.toString():""));
}
