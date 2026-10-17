export function learnerCourseTabPersistentQuery(query:Record<string,string|string[]|undefined>):string{
 const out=new URLSearchParams();
 for(const [key,value] of Object.entries(query).slice(0,20)){
  if(["lesson","content","filter"].includes(key)||key.length>100)continue;
  const first=Array.isArray(value)?value[0]:value;
  if(typeof first==="string"&&first.length<=500)out.set(key,first);
 }
 return out.toString();
}
