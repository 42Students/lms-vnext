import {verificationQueueFilters} from "./queue-filters";
/** Reject ambiguous duplicate keys rather than silently taking the last value. */
export function parseVerificationExportQuery(params:URLSearchParams){
 const raw:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)throw new Error("DUPLICATE_VERIFICATION_EXPORT_FILTER");
  raw[key]=params.get(key)??"";
 }
 return verificationQueueFilters.parse(raw);
}
