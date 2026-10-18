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

/** An expired/out-of-range link should not pretend that a later page exists. */
export function clampCompanySharePage(requestedPage:number,total:number){
 const totalPages=Math.max(1,Math.ceil(Math.max(0,total)/25));
 return {page:Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(requestedPage,totalPages)):1,totalPages};
}
