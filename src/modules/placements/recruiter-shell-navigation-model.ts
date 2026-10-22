import {z} from "zod";

/** REC-calendar-messages-profile-24: data-only recruiter navigation contract.
 * Shared shell remains owned by chat-9 while UX playbook auditing is underway.
 */
export const RECRUITER_LEGACY_MOBILE_DESTINATIONS=[
 {label:"Today",href:"/hr/home"},
 {label:"Drives",href:"/hr/drives"},
 {label:"Calendar",href:"/hr/calendar"},
 {label:"Messages",href:"/hr/conversations"},
 {label:"Company",href:"/hr/company"},
] as const;

export function recruiterLegacyMobileNavigation(activePath:string,rawCollegeId?:string|null){
 const id=rawCollegeId&&z.string().uuid().safeParse(rawCollegeId).success?rawCollegeId:null;
 const path=activePath.split(/[?#]/,1)[0]??"";
 return RECRUITER_LEGACY_MOBILE_DESTINATIONS.map(item=>({
  ...item,
  href:item.href+(id?"?collegeId="+encodeURIComponent(id):""),
  active:path===item.href||path.startsWith(item.href+"/"),
 }));
}
export function recruiterLegacyHeaderCollege(
 grants:readonly {collegeId:string;collegeName:string}[],
 selectedCollegeId:string|null|undefined,
):{collegeId:string;collegeName:string}|null{
 const available=grants.filter(g=>z.string().uuid().safeParse(g.collegeId).success&&
  g.collegeName.trim().length>0);
 const selected=selectedCollegeId?available.find(g=>g.collegeId===selectedCollegeId):null;
 if(selected)return {collegeId:selected.collegeId,collegeName:selected.collegeName.trim()};
 const soleCollege=available.length===1?available[0]:undefined;
 if(soleCollege&&(!selectedCollegeId||selectedCollegeId===soleCollege.collegeId))
  return {collegeId:soleCollege.collegeId,collegeName:soleCollege.collegeName.trim()};
 // Multiple colleges: never guess the active brand; shell must show a chooser.
 return null;
}
