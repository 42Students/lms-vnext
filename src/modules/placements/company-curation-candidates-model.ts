import {companyDomainFromWebsite} from "./company-curation-domain-model";
type CompanyReference={companyId:string;name:string;website:string|null};
export function findPossibleCompanyDuplicates(rows:readonly CompanyReference[]) {
 const groups=new Map<string,Map<string,{id:string;name:string}>>();
 for(const row of rows) {
  const domain=row.website?companyDomainFromWebsite(row.website):null;
  if(!domain)continue;
  if(!groups.has(domain))groups.set(domain,new Map());
  groups.get(domain)!.set(row.companyId,{id:row.companyId,name:row.name});
 }
 return [...groups].map(([domain,companies])=>({domain,companies:[...companies.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id))}))
  .filter(group=>group.companies.length>1).sort((a,b)=>a.domain.localeCompare(b.domain));
}
