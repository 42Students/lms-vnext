import {PUBLIC_SUFFIX_RULE_DATA} from "./public-suffix-data";

/** PSL registrable-domain boundary. The vendored ICANN + PRIVATE rules
 * include wildcard and exception entries; this prevents unrelated tenants on
 * shared hosts (e.g. *.blogspot.com) collapsing to one corporate identity.
 * This is data-only, not a new runtime package. */
const SUFFIX_RULES=new Set(PUBLIC_SUFFIX_RULE_DATA.split("\n").map(raw=>{
 const marker=raw.startsWith("!")?"!":raw.startsWith("*.")?"*.":"";
 const rule=raw.slice(marker.length);
 try{return marker+new URL("https://"+rule).hostname.toLowerCase()}
 catch{return marker+rule.toLowerCase()}
}));

export function registrableCompanyHost(rawHost:string):string{
 let host:string;
 try{
  const parsed=new URL("https://"+rawHost);
  if(parsed.username||parsed.password||parsed.port||parsed.pathname!=="/"||
     parsed.search||parsed.hash)return "";
  host=parsed.hostname.toLowerCase();
 }catch{return ""}
 if(host.length<4||host.length>253)return "";
 const hostnameLabels=host.split(".");
 if(hostnameLabels.length<2||
   !/^[a-z]{2,63}$/.test(hostnameLabels[hostnameLabels.length-1]??"")||
   !hostnameLabels.every(label=>label.length>0&&label.length<=63&&
     /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)))return "";
 const labels=host.split(".");
 let ruleSize=1,exceptionSize:number|null=null;
 for(let i=0;i<labels.length;i++){
  const candidate=labels.slice(i).join(".");
  const length=labels.length-i;
  if(SUFFIX_RULES.has("!"+candidate)){exceptionSize=length;break}
  if(SUFFIX_RULES.has(candidate))ruleSize=Math.max(ruleSize,length);
  if(i+1<labels.length&&SUFFIX_RULES.has("*."+labels.slice(i+1).join(".")))
   ruleSize=Math.max(ruleSize,length);
 }
 const publicSuffixLength=exceptionSize===null?ruleSize:exceptionSize-1;
 // A bare public suffix is not a registrable employer-controlled domain.
 return labels.length>publicSuffixLength?
  labels.slice(-(publicSuffixLength+1)).join("."):"";
}
