/** A request never grants teammate access or directly changes a verified
 * company record. The placement cell must check the facts and permissions. */
export function recruiterCompanyChangeRequest(input:{
 companyName:string;kind:"PROFILE"|"TEAM";detail:string;
 teammate?:{email:string|null;name:string|null};
}):string|null{
 const trim=(v:string,max:number)=>v.trim().replace(/[\x00-\x1f\x7f]+/g," ").slice(0,max);
 const company=trim(input.companyName,120);
 const detail=trim(input.detail,1800);
 if(!company||detail.length<8||detail.length>1800)return null;
 if(input.kind==="TEAM"&&!input.teammate?.email)return null;
 const person=input.teammate;
 return [
  input.kind==="TEAM"?"Recruiter requests teammate access review":"Recruiter requests company profile correction",
  "Company: "+company,
  ...(input.kind==="TEAM"?["Teammate: "+trim(person?.name||"Recruiter",120),
    "Work email: "+trim(person?.email||"",254)]:[]),
  "Requested change: "+detail,
  input.kind==="TEAM"?
   "Please verify with the company and college before modifying this person's access. This request grants no permissions.":
   "Please check with the placement cell to verify company identity and trusted domains before updating the company record.",
 ].join("\n");
}
