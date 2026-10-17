/** TPO-batches-16: preserve the caller's list view, never an external redirect. */
const filterKeys=new Set(["q","state","sort","program","department","deadline","page","pageSize","showOlder"]);
export function tpoBatchReturnHref(raw:unknown):string{
 if(typeof raw!=="string"||raw.length>1800)return "/tpo/batches";
 if(raw==="/tpo/batches")return raw;
 if(!raw.startsWith("/tpo/batches?"))return "/tpo/batches";
 try{
  const parsed=new URL(raw,"https://example.invalid");
  if(parsed.pathname!=="/tpo/batches"||parsed.hash)return "/tpo/batches";
  for(const [key] of parsed.searchParams){
   if(!filterKeys.has(key))return "/tpo/batches";
  }
  return parsed.pathname+"?"+parsed.searchParams.toString();
 }catch{return "/tpo/batches";}
}
