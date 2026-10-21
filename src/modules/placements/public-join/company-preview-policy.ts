import { matchesCompanyDomain } from "./domain-model";
/** Accept any server-approved company domain, including verified secondary domains.
 * A verified work mailbox is still required; a domain match alone grants no access.
 * Callers must source this list from the linked company, never user input. */
export function companyJoinEmailCandidate(
 workEmail:string,companyDomains:string|readonly string[],
){
 const domains=typeof companyDomains==="string"?[companyDomains]:companyDomains;
 return domains.some(domain=>matchesCompanyDomain(workEmail,domain));
}
