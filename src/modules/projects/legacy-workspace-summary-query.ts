/** Keep all safe, non-identity query arguments when resolving old workspace
 * bookmarks. The legacy page preserved unknown keys too, so restricting this
 * to a fixed allowlist drops newer template, filter and return-flow state. */
export function legacyWorkspaceSummaryQuery(
 query:Record<string,string|string[]|undefined>,
):string{
 const suffix=new URLSearchParams();
 for(const [name,raw] of Object.entries(query)){
  if(!name||name==="id"||name==="workspaceId"||name.length>80||
     /[<>\x00-\x1f]/.test(name))continue;
  const values=Array.isArray(raw)?raw:raw===undefined?[]:[raw];
  for(const value of values){
   if(value.length>240||/[<>\x00-\x1f]/.test(value)||
      (name==="openTemplate"&&value!=="1"))continue;
   suffix.append(name,value);
  }
 }
 return suffix.toString();
}
