import {z} from "zod";
export const companyShareStatusSchema=z.enum(["ALL","ACTIVE","EXPIRED","REVOKED"]);
export type CompanyShareStatus=z.infer<typeof companyShareStatusSchema>;
export function companyShareStatusLabel(status:CompanyShareStatus){
 return status==="ALL"?"All links":status==="ACTIVE"?"Active":status==="EXPIRED"?"Expired":"Revoked";
}

export function companyShareEmptyMessage(status:CompanyShareStatus){
 return status==="ACTIVE"?"No active links match this filter.":
  status==="EXPIRED"?"No expired links match this filter.":
  status==="REVOKED"?"No revoked links match this filter.":
  "No company-share links have been recorded.";
}
export function shouldDisplayNewCompanyShare(status:CompanyShareStatus){
 return status==="ALL"||status==="ACTIVE";
}
