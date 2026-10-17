import {tpoApplicantPipelineParams} from "./tpo-applicant-pipeline-model";
import {TPO_APPLICATION_VISIBLE_KEYS,validTpoColumnPreference} from "./tpo-grid-model";
/** Fail closed on ambiguous application pipeline filter parameters. */
export function tpoApplicationUrlError(raw:Record<string,string|string[]|undefined>):string|null {
 if(Object.values(raw).some(value=>Array.isArray(value)))return "Repeated applicant filters are not allowed.";
 const allowed=new Set(["stage","search","page","channel","eligibility","sort","submittedWithin","flag","columns"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)))return "Unsupported applicant filter. No application records were loaded.";
 if(!validTpoColumnPreference(typeof raw.columns==="string"?raw.columns:undefined,TPO_APPLICATION_VISIBLE_KEYS))
  return "Saved applicant grid columns are invalid. No application records were loaded.";
 return null;
}

/** Validate the complete typed route contract before any protected application reads. */
export function tpoApplicationFilterError(raw:Record<string,string|string[]|undefined>,jobId:string):string|null{
 const ambiguity=tpoApplicationUrlError(raw);
 if(ambiguity)return ambiguity;
 const other=Object.fromEntries(Object.entries(raw).filter(([key])=>key!=="columns"));
 const values=Object.fromEntries(Object.entries(other).filter(([,value])=>value!==""&&value!==undefined));
 return tpoApplicantPipelineParams.safeParse({jobId,...values}).success?null:
  "Invalid applicant stage, search, date, or page filter. No application records were loaded.";
}
