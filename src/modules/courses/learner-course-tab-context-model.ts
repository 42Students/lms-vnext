export function learnerCourseTabPersistentQuery(query:Record<string,string|string[]|undefined>):string{
 const out=new URLSearchParams();
 // Legacy tab navigation keeps unrelated keys in insertion order while
 // removing lesson/content/filter. Count only retained keys toward the
 // anti-abuse 20-key cap; malformed multi-value queries cannot override them.
 for(const [key,value] of Object.entries(query)){
  if(["lesson","content","filter"].includes(key)||key.length>100||
     !/^[A-Za-z0-9_.-]+$/.test(key))continue;
  const first=Array.isArray(value)?value.length===1?value[0]:undefined:value;
  if(typeof first==="string"&&first.length<=500){
   out.set(key,first);
   if([...out.keys()].length>=20)break;
  }
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
