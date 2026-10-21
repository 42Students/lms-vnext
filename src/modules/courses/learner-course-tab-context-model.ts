export function learnerCourseTabPersistentQuery(query:Record<string,string|string[]|undefined>):string{
 const out=new URLSearchParams();
 for(const [key,value] of Object.entries(query).slice(0,20)){
  if(["lesson","content","filter"].includes(key)||key.length>100)continue;
  const first=Array.isArray(value)?value[0]:value;
  if(typeof first==="string"&&first.length<=500)out.set(key,first);
 }
 return out.toString();
}

/** The entry route and tab links must use the same bounded query policy.
 * Preserve legacy cls and harmless unknown selectors, but do not carry
 * lesson/content-specific or oversized values into the course home route. */
export function learnerCourseBaseRedirectHref(
 deliveryId:string,query:Record<string,string|string[]|undefined>,
):string{
 const suffix=learnerCourseTabPersistentQuery(query);
 const base="/learn/courses/"+encodeURIComponent(deliveryId)+"/home";
 return suffix?base+"?"+suffix:base;
}
