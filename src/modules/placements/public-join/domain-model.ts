import { publicRecruiterWorkEmailSchema } from "../public-college-join-model";
/** Conservative fallback domain grouping. Full Public Suffix List support requires
 * a pinned, reviewed PSL dataset/dependency; never claim this shortlist covers
 * all registrable suffixes or grant recruiter access from this guess alone.
 */
const MULTI_PART_SUFFIXES = new Set([
 "co.in","ac.in","gov.in","org.in","net.in","co.uk","org.uk","ac.uk","com.au","net.au","org.au","co.nz","com.sg","com.br","co.jp","co.kr","com.mx",
]);
export function registrableWorkDomain(email: string):string|null{
 const parsed=publicRecruiterWorkEmailSchema.safeParse(email);
 if(!parsed.success)return null;
 const labels=parsed.data.split("@")[1].split(".");
 if(labels.length<2)return null;
 const suffix=labels.slice(-2).join(".");
 if(MULTI_PART_SUFFIXES.has(suffix)){
  if(labels.length<3)return null;
  return labels.slice(-3).join(".");
 }
 return labels.slice(-2).join(".");
}
/** Only an exact company domain or its subdomain can use the company's link. */
export function matchesCompanyDomain(workEmail:string,companyDomain:string){
 const parsed=publicRecruiterWorkEmailSchema.safeParse(workEmail);
 const domain=companyDomain.trim().toLowerCase().replace(/^@/,"");
 // Reject leading/trailing empty labels and lookalike host syntax; only
 // exact or subdomain matching is used for authorization.
 if(!parsed.success||!domain.includes(".")||domain.startsWith(".")||domain.endsWith(".")||domain.includes("..")||!/^[a-z0-9.-]+$/.test(domain))return false;
 const host=parsed.data.split("@")[1];
 return host===domain||host.endsWith("."+domain);
}
