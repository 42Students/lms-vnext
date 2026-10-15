import {z} from "zod";
export const companyShareStatusSchema=z.enum(["ALL","ACTIVE","EXPIRED","REVOKED"]);
export type CompanyShareStatus=z.infer<typeof companyShareStatusSchema>;
export function companyShareStatusLabel(status:CompanyShareStatus){
 return status==="ALL"?"All links":status==="ACTIVE"?"Active":status==="EXPIRED"?"Expired":"Revoked";
}
