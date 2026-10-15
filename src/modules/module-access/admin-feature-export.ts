import type {AdminModuleDecision} from "./admin-read-model";
import {OPTIONAL_MODULE_KEYS} from "./service";
type FeatureCsvRow={name:string;code:string;modules:readonly AdminModuleDecision[]};
const csvCell=(value:string)=>{
 const flat=value.replace(/[\r\n\t]/g," ");
 const protectedValue=/^[\s\uFEFF]*[=+\-@]/u.test(flat)?"'"+flat:flat;
 return '"'+protectedValue.replaceAll('"','""')+'"';
};
/** Only the page returned from an authorized service call, never arbitrary college identities. */
export function superAdminFeaturePageCsv(rows:readonly FeatureCsvRow[]):string{
 const headings=["College","Code",...OPTIONAL_MODULE_KEYS.flatMap(key=>[key+" effective",key+" rule source",key+" locked"])];
 const lines=rows.slice(0,20).map(row=>{
  const moduleValues=OPTIONAL_MODULE_KEYS.flatMap(key=>{
   const module=row.modules.find(item=>item.module===key);
   if(!module)return ["Unknown","Unknown","Unknown"];
   return [module.enabled?"On":"Off",module.source==="PERSISTED"?module.level:"Source default",module.locked?"Yes":"No"];
  });
  return [row.name,row.code,...moduleValues].map(csvCell).join(",");
 });
 return [headings.map(csvCell).join(","),...lines].join("\r\n")+"\r\n";
}
