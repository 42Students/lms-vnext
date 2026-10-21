import {redirect} from "next/navigation";

type Params=Record<string,string|string[]|undefined>;
/** Old college Workspaces > Deleted URL remains a scoped alias of the vNext
 * deleted-workspace recovery page, rather than showing active workspaces. */
export default async function LegacyDeletedWorkspacesPage({searchParams}:{
 searchParams:Promise<Params>;
}){
 const raw=await searchParams;
 const query=new URLSearchParams();
 for(const name of ["page","pageSize","size"] as const){
  const value=raw[name];
  if(typeof value!=="string")continue;
  if(name==="page"&&/^[1-9][0-9]{0,5}$/.test(value))query.set("page",value);
  if((name==="size"||name==="pageSize")&&["10","20","50","100"].includes(value))
   query.set("pageSize",value);
 }
 redirect("/college/projects/deleted"+(query.size?"?"+query.toString():""));
}
