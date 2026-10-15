import {z} from "zod";
export const publicApplicantSearchSchema=z.string().trim().max(80).default("");
/** Treat SQL wildcard input as literal learner-name text. */
export function escapeLiteralApplicantSearch(value:string){
 return value.replace(/[\\%_]/g,"\\$&");
}
export function companyShareApplicantHref(token:string,page:number,search:string){
 const query=new URLSearchParams();
 if(page>1)query.set("page",String(page));
 if(search)query.set("q",search);
 const suffix=query.toString();
 return "/company-share/"+encodeURIComponent(token)+(suffix?"?"+suffix:"");
}
