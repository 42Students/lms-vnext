/** Source criteria that cannot be represented must stay visible and
 * disabled, rather than silently broadening membership to every student. */
const allowed=new Set(["departmentId","programId","batchId","sectionId","year","minCgpa"]);
export function importLegacyGroupCriteria(input:Record<string,unknown>){
 const accepted:Record<string,unknown>={},unsupported:string[]=[];
 for(const [key,value] of Object.entries(input)){
  if(allowed.has(key)&&value!==undefined&&value!==null)accepted[key]=value;
  else unsupported.push(key);
 }
 return {accepted,unsupported,enabled:unsupported.length===0};
}
export function legacyGroupDeepLink(legacyGroupId:number|null,uuid:string){
 return "/college/students/groups/"+encodeURIComponent(uuid)+
  (legacyGroupId!==null?"?legacyGroup="+encodeURIComponent(String(legacyGroupId)):"");
}
export function groupPromotionCopy(waitlistCount:number){
 return waitlistCount===0?"No students waiting":waitlistCount+" students on the waitlist";
}
