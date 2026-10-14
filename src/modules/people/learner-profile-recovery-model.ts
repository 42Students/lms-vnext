import {AuthorizationError} from "@/modules/permissions/policy";
export function learnerProfileAcademicRecovery<T>(result:PromiseSettledResult<T>):{available:true;summary:T}|{available:false;summary:null}{
  if(result.status==="fulfilled")return {available:true,summary:result.value};
  // Never mask tenant, role or live-account revocation as a partial read.
  if(result.reason instanceof AuthorizationError)throw result.reason;
  return {available:false,summary:null};
}
