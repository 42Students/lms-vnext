/** Never render an executable script/data URL or embed credentials in an
 * external course resource link. This applies to trusted but editable faculty data. */
export function learnerSafeExternalContentHref(value: string|null|undefined):string|null {
 if(!value||value.length>2048)return null;
 try{
  const parsed=new URL(value.trim());
  if(!["https:","http:"].includes(parsed.protocol))return null;
  if(!parsed.hostname||parsed.username||parsed.password)return null;
  return parsed.href;
 }catch{return null;}
}

/** A signed private PDF preview is not an arbitrary external content URL.
 * Use only a caller-supplied set of server-configured trusted storage origins,
 * never a host inferred from untrusted course material or query parameters.
 * A PDF sandbox must never pair allow-same-origin with allow-scripts.
 */
export function learnerSafeSignedPdfEmbed(
 value:string|null|undefined,
 approvedStorageOrigins:readonly string[],
):{src:string;sandbox:"allow-same-origin"}|null{
 if(!value||value.length>4096||approvedStorageOrigins.length===0)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.hash)return null;
  const trusted=approvedStorageOrigins.some(origin=>{
   try{
    const approved=new URL(origin);
    return approved.protocol==="https:"&&approved.origin===url.origin&&
      !approved.username&&!approved.password&&!approved.search&&!approved.hash;
   }catch{return false;}
  });
  if(!trusted)return null;
  if(!url.searchParams.has("X-Amz-Signature") ||
     !url.searchParams.has("X-Amz-Expires"))return null;
  return {src:url.href,sandbox:"allow-same-origin"};
 }catch{return null;}
}
