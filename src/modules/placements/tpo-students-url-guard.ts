import {TPO_STUDENT_VISIBLE_KEYS,validTpoColumnPreference} from "./tpo-grid-model";
import {TPO_STUDENT_LEGACY_FILTER_ALIASES} from "./tpo-students-filter-aliases";
/** Never choose the first of repeated query values on an authorized student roster. */
export function tpoStudentUrlError(raw:Record<string,string|string[]|undefined>):string|null {
  if(Object.values(raw).some(value=>Array.isArray(value))) return "Repeated Students filters are not allowed. No student data was loaded.";
  const supported = new Set(["journeyState","branchId","programId","classId","afterCollege","profileStatus","minApplications","maxApplications","minOffers","maxOffers","offerWaiting","minCgpa","maxCgpa","maxActiveBacklogs","maxPastBacklogs","cgpaRecorded","batchId","search","q","page","pageSize","columns","student",
    "legacyStage","minRoundReached","needsAttention","interviewedWith","debarred","gender","birthYear","minSkills","minProjects","minCertifications","minExperiences","hasProfileLinks",
    "minTenthPct","minTwelfthPct","minDiplomaPct","minUgPct","passingYear","maxGapYears","marksVerified","isLateralEntry","hasResume","hasCodingProfiles","skillName"]);
  if(Object.entries(TPO_STUDENT_LEGACY_FILTER_ALIASES).some(([alias,key])=>raw[alias]!==undefined&&raw[key]!==undefined))return "Choose each student filter once. No student data was loaded.";
  if(typeof raw.q==="string"&&raw.search!==undefined) return "Use one Students search field at a time.";
  if(Object.keys(raw).some(key=>!supported.has(key)&&!Object.hasOwn(TPO_STUDENT_LEGACY_FILTER_ALIASES,key))) return "Unsupported Students filter. No student data was loaded.";
  if(typeof raw.student==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.student))
    return "The selected student is invalid. No student data was loaded.";
  if(!validTpoColumnPreference(typeof raw.columns==="string"?raw.columns:undefined,TPO_STUDENT_VISIBLE_KEYS))
    return "Saved Students columns are invalid. No student data was loaded.";
  return null;
}

/** Only stale nonempty pages should keep filters when recovering; zero matches need a real reset. */
export function tpoStudentEmptyRecoveryHref(total:number,firstPageHref:string):string {
 return total>0?firstPageHref:"/tpo/students";
}

/** Safe field-level diagnosis after the strict typed roster query refuses a request. */
export function tpoStudentFilterMessage(raw:Record<string,string|string[]|undefined>):string {
 const guarded=tpoStudentUrlError(raw);
 if(guarded)return guarded;
 if(typeof raw.page==="string"&&!/^[1-9][0-9]*$/.test(raw.page))
  return "Student page must be a positive whole number. No student data was loaded.";
 if(typeof raw.pageSize==="string"&&!/^[1-9][0-9]*$/.test(raw.pageSize))
  return "Page size must be a positive whole number. No student data was loaded.";
 if(typeof (raw.search??raw.q)==="string"&&String(raw.search??raw.q).length>150)
  return "Student search is too long. No student data was loaded.";
 for(const key of ["maxActiveBacklogs","maxPastBacklogs"]){
  const value=raw[key];
  if(typeof value==="string"&&(!/^(0|[1-9][0-9]*)$/.test(value)||Number(value)>100))
   return "Backlog count must be a whole number between 0 and 100.";
 }
 for(const key of ["minCgpa","maxCgpa"]){
  const value=raw[key];
  if(typeof value==="string"&&(!/^(?:[0-9]|10)(?:\\.[0-9]{1,2})?$/.test(value)||Number(value)>10))
   return "CGPA must be between 0 and 10 (up to two decimal places).";
 }
 if(typeof raw.cgpaRecorded==="string"&&!["YES","NO"].includes(raw.cgpaRecorded))
  return "CGPA recorded filter must be Yes or No.";
 if(typeof raw.offerWaiting==="string"&&!["YES","NO"].includes(raw.offerWaiting))
  return "Offer waiting filter must be Yes or No.";
 for(const key of ["minApplications","maxApplications","minOffers","maxOffers"]){
  const value=raw[key];
  if(typeof value==="string"&&(!/^(0|[1-9][0-9]*)$/.test(value)||Number(value)>10000))
   return "Invalid Applications/Offers count range. Use a whole number from 0 to 10000.";
 }
 if(typeof raw.profileStatus==="string"&&
  !["VERIFIED","WAITING","SENT_BACK","NOT_VERIFIED"].includes(raw.profileStatus))
  return "Invalid profile verification filter. No student data was loaded.";
 if(typeof raw.afterCollege==="string"&&
  !["PLACED_ON_CAMPUS","PLACED_OFF_CAMPUS","HIGHER_STUDIES","ENTREPRENEURSHIP",
    "COMPETITIVE_EXAMS","NOT_INTERESTED","LOOKING_FOR_JOB","DEBARRED","NOT_DECIDED"].includes(raw.afterCollege))
  return "The selected after-college outcome is invalid. No student data was loaded.";
 if(typeof raw.classId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.classId))
  return "The selected class is invalid. No student data was loaded.";
 if(typeof raw.programId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.programId))
  return "The selected academic program is invalid. No student data was loaded.";
 if(typeof raw.batchId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.batchId))
  return "The selected batch is invalid. No student data was loaded.";
 if(typeof raw.branchId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.branchId))
  return "The selected academic branch is invalid. No student data was loaded.";
 return "A Student journey, branch or paging filter is invalid. No student data was loaded.";
}
