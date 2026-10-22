import { publicRecruiterWorkEmailSchema } from "../public-college-join-model";
/** Conservative fallback domain grouping. Full Public Suffix List support requires
 * a pinned, reviewed PSL dataset/dependency; never claim this shortlist covers
 * all registrable suffixes or grant recruiter access from this guess alone.
 */
const MULTI_PART_SUFFIXES = new Set([
 "co.in","ac.in","gov.in","org.in","net.in","co.uk","org.uk","ac.uk","com.au","net.au","org.au","co.nz","com.sg","com.br","co.jp","co.kr","com.mx",
]);
/** Common private PSL rules: tenants must not claim shared hosting suffixes.
 * This fail-closed supplement does not replace a full pinned PSL.
 */
const PRIVATE_MULTI_TENANT_SUFFIXES=new Set([
 "github.io","gitlab.io","pages.dev","workers.dev","vercel.app",
 "netlify.app","appspot.com","firebaseapp.com","web.app",
 "herokuapp.com","onrender.com","fly.dev","azurewebsites.net",
 "cloudfront.net","s3.amazonaws.com","blogspot.com","wordpress.com",
]);
const SHARED_EMAIL_DOMAINS=new Set([
 "gmail.com","googlemail.com","outlook.com","hotmail.com","live.com",
 "yahoo.com","yahoo.co.in","icloud.com","me.com","aol.com","proton.me",
 "protonmail.com","zoho.com","mail.com",
]);
export function registrableWorkDomain(email: string):string|null{
 const parsed=publicRecruiterWorkEmailSchema.safeParse(email);
 if(!parsed.success)return null;
 const emailDomain=parsed.data.split("@")[1];
 if(!emailDomain)return null;
 const labels=emailDomain.split(".");
 if(labels.length<2)return null;
 const suffix=labels.slice(-2).join(".");
 const lastThree=labels.slice(-3).join(".");
 const privateSuffix=PRIVATE_MULTI_TENANT_SUFFIXES.has(lastThree)
  ?lastThree:PRIVATE_MULTI_TENANT_SUFFIXES.has(suffix)?suffix:null;
 if(privateSuffix){
  const suffixDepth=privateSuffix.split(".").length;
  if(labels.length<=suffixDepth)return null;
  const owned=labels.slice(-suffixDepth-1).join(".");
  return SHARED_EMAIL_DOMAINS.has(owned)?null:owned;
 }
 if(MULTI_PART_SUFFIXES.has(suffix)){
  if(labels.length<3)return null;
  const owned=labels.slice(-3).join(".");
  return SHARED_EMAIL_DOMAINS.has(owned)?null:owned;
 }
 const owned=labels.slice(-2).join(".");
 return SHARED_EMAIL_DOMAINS.has(owned)?null:owned;
}
/** Normalize a reviewed company-domain input from the legacy forms.
 * Accept a bare host, @host, an email address or a standard HTTP(S) URL;
 * reject credentials, wildcard hosts, ports and ambiguous hostname syntax.
 * This only normalizes a candidate; it never verifies company ownership.
 */
export function normalizeCompanyDomainInput(raw:string):string|null{
 let source=raw.trim().toLocaleLowerCase("en-US");
 if(!source)return null;
 if(/^https?:\/\//.test(source)){
  try{
   const url=new URL(source);
   if(url.username||url.password||url.port||!["http:","https:"].includes(url.protocol))
    return null;
   source=url.hostname;
  }catch{return null;}
 }else if(source.startsWith("@")){
  source=source.slice(1);
 }else if(source.includes("@")){
  const pieces=source.split("@");
  if(pieces.length!==2||!pieces[0])return null;
  const domain=pieces[1];
  if(!domain)return null;
  source=domain;
 }
 if(source.endsWith("."))source=source.slice(0,-1);
 if(source.length>253||source.length<4||!source.includes(".")||
    source.includes("..")||!/^[a-z0-9.-]+$/.test(source))return null;
 const labels=source.split(".");
 if(labels.some(label=>!label||label.length>63||label.startsWith("-")||label.endsWith("-")))
  return null;
 if(SHARED_EMAIL_DOMAINS.has(source)||PRIVATE_MULTI_TENANT_SUFFIXES.has(source)||
    MULTI_PART_SUFFIXES.has(source))return null;
 return source;
}
/** Only an exact company domain or its subdomain can use the company's link. */
export function matchesCompanyDomain(workEmail:string,companyDomain:string){
 const parsed=publicRecruiterWorkEmailSchema.safeParse(workEmail);
 const domain=normalizeCompanyDomainInput(companyDomain);
 // Input normalization does not confer authorization; the email must still
 // exactly match the reviewed domain or a dot-delimited subdomain.
 if(!parsed.success||!domain)return false;
 const host=parsed.data.split("@")[1];
 return host!==undefined&&(host===domain||host.endsWith("."+domain));
}
