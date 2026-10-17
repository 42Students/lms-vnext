import {TPO_STUDENT_VISIBLE_KEYS,validTpoColumnPreference} from "./tpo-grid-model";
/** Never choose the first of repeated query values on an authorized student roster. */
export function tpoStudentUrlError(raw:Record<string,string|string[]|undefined>):string|null {
  if(Object.values(raw).some(value=>Array.isArray(value))) return "Repeated Students filters are not allowed. No student data was loaded.";
  const supported = new Set(["journeyState","branchId","programId","batchId","search","page","pageSize","columns","student"]);
  if(Object.keys(raw).some(key=>!supported.has(key))) return "Unsupported Students filter. No student data was loaded.";
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
 if(typeof raw.search==="string"&&raw.search.length>150)
  return "Student search is too long. No student data was loaded.";
 if(typeof raw.programId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.programId))
  return "The selected academic program is invalid. No student data was loaded.";
 if(typeof raw.batchId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.batchId))
  return "The selected batch is invalid. No student data was loaded.";
 if(typeof raw.branchId==="string"&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.branchId))
  return "The selected academic branch is invalid. No student data was loaded.";
 return "A Student journey, branch or paging filter is invalid. No student data was loaded.";
}
