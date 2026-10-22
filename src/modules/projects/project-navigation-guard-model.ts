/** A tab-only mentor project navigation keeps its project-scoped section
 * cache mounted, so a modal draft may remain open. Other navigation must
 * use the unsaved-changes confirmation instead. */
export function canKeepProjectEditorMountedAcrossNavigation(
 from:string,to:string,
):boolean{
 try{
  const oldUrl=new URL(from),nextUrl=new URL(to,oldUrl);
  if(oldUrl.origin!==nextUrl.origin||oldUrl.pathname!==nextUrl.pathname)return false;
  if(oldUrl.search===nextUrl.search)return true;
  if(!/^\/mentor\/projects\/[^/]+\/?$/.test(oldUrl.pathname))return false;
  const oldQuery=new URLSearchParams(oldUrl.search);
  const nextQuery=new URLSearchParams(nextUrl.search);
  oldQuery.delete("tab");nextQuery.delete("tab");
  oldQuery.sort();nextQuery.sort();
  return oldQuery.toString()===nextQuery.toString();
 }catch{return false;}
}
