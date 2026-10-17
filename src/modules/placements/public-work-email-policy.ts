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
export type WorkEmailIssue="PERSONAL"|"DISPOSABLE"|"ACADEMIC"|"IP_ADDRESS"|"INVALID"|null;
export function publicWorkEmailIssue(email:string):WorkEmailIssue{
 const parts=email.trim().toLowerCase().split("@");
 if(parts.length!==2||!parts[0]||!parts[1])return "INVALID";
 const domain=parts[1];
 if(!/^[a-z0-9.-]+$/.test(domain)||!domain.includes(".")||
  domain.startsWith(".")||domain.endsWith(".")||domain.includes(".."))return "INVALID";
 if(/^\d+\.\d+\.\d+\.\d+$/.test(domain)||/^\[/.test(domain))return "IP_ADDRESS";
 if(PERSONAL.has(domain))return "PERSONAL";
 if(DISPOSABLE.has(domain)||domain.startsWith("mailinator.")||domain.endsWith(".tempmail.com"))
  return "DISPOSABLE";
 if(/\.(edu|edu\.[a-z]{2}|ac\.[a-z]{2}|sch\.[a-z]{2})$/.test(domain))
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
