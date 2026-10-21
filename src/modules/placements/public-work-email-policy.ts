/** Conservative business-mail validation before OTP delivery. The MX check is
 * server-side; the browser never treats a domain check as identity proof. */
const PERSONAL=new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com",
 "icloud.com","proton.me","protonmail.com","aol.com","live.com","msn.com",
 "me.com","mac.com","ymail.com","rocketmail.com","rediffmail.com","mail.com",
 "gmx.com","yandex.com","yandex.ru","zoho.com","yahoo.co.in","qq.com",
 "163.com","126.com","mail.ru","fastmail.com","hey.com","tutanota.com"]);
const DISPOSABLE=new Set(["mailinator.com","guerrillamail.com","tempmail.com",
 "10minutemail.com","yopmail.com","trashmail.com","getnada.com",
 "dispostable.com","temp-mail.org","sharklasers.com","fakeinbox.com"]);
/** Keep in sync with CompanyDomainService's resource-backed policy at
 * registration time. Resource files are not bundled in the vNext snapshot;
 * unknown providers need a centrally reviewed list, not permissive guesses.
 */
const ACADEMIC_SUFFIXES=[".ac.in",".edu.in",".res.in",".edu",".ac.uk",
 ".edu.au",".ac.nz",".edu.sg",".ac.jp",".edu.cn"];
export type WorkEmailIssue="PERSONAL"|"DISPOSABLE"|"ACADEMIC"|"IP_ADDRESS"|"INVALID"|null;
export function publicWorkEmailIssue(email:string):WorkEmailIssue{
 const parts=email.trim().toLowerCase().split("@");
 if(parts.length!==2||!parts[0]||!parts[1])return "INVALID";
 const domain=parts[1];
 // Reject IPv4 shorthand, all-numeric/octal/hex host forms and IPv6
 // literals BEFORE hostname validation (which otherwise calls them INVALID).
 if(domain.includes(":")||domain.startsWith("[")||
    /^[0-9.]+$/.test(domain)||
    domain.split(".").every(label=>/^(?:0x[0-9a-f]+|0[0-7]+|[0-9]+)$/i.test(label)))
    return "IP_ADDRESS";
 if(!/^[a-z0-9.-]+$/.test(domain)||!domain.includes(".")||
  domain.startsWith(".")||domain.endsWith(".")||domain.includes(".."))return "INVALID";

 if(PERSONAL.has(domain))return "PERSONAL";
 if(DISPOSABLE.has(domain)||domain.startsWith("mailinator.")||domain.endsWith(".tempmail.com"))
  return "DISPOSABLE";
 if(ACADEMIC_SUFFIXES.some(suffix=>domain.endsWith(suffix))||/\.sch\.[a-z]{2}$/.test(domain))
  return "ACADEMIC";
 return null;
}
export function publicWorkEmailIssueCopy(issue:Exclude<WorkEmailIssue,null>){
 return issue==="PERSONAL"?"Use a company work email, not a personal email address.":
  issue==="DISPOSABLE"?"Temporary email addresses cannot be used. Enter your company email.":
  issue==="ACADEMIC"?"Enter a company work email, not an academic address.":
  issue==="IP_ADDRESS"?"Enter a company email with a valid domain name.":
  "Enter a valid company work email address.";
}
