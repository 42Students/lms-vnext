import {workEmailDomain} from "../public-college-join-model";
/** A matching domain is necessary, but NEVER sufficient for an access grant. */
export function companyJoinEmailCandidate(workEmail:string,companyDomain:string){
 const domain=workEmailDomain(workEmail);
 return !!domain && domain===companyDomain.trim().toLowerCase();
}
