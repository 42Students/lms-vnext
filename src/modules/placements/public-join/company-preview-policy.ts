import { matchesCompanyDomain } from "./domain-model";
/** A verified work mailbox is still required; a domain match alone grants no access. */
export function companyJoinEmailCandidate(workEmail:string,companyDomain:string){
 return matchesCompanyDomain(workEmail,companyDomain);
}
