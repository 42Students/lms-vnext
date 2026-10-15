import {canonicalCompanyAlias} from "./company-curation-alias-model";
type NameReference={companyId:string;name:string};
export function findCompanyNameIdentityConflicts(rows:readonly NameReference[]){
 const groups=new Map<string,{label:string;ids:Set<string>}>();
 for(const row of rows){
  const key=canonicalCompanyAlias(row.name);
  if(!key)continue;
  const entry=groups.get(key)??{label:row.name.trim(),ids:new Set<string>()};
  entry.ids.add(row.companyId);
  groups.set(key,entry);
 }
 return [...groups].filter(([,group])=>group.ids.size>1)
  .map(([key,group])=>({key,label:group.label,companyIds:[...group.ids].sort()}))
  .sort((a,b)=>a.key.localeCompare(b.key));
}
