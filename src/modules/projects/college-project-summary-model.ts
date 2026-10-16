import {z} from "zod";
export const collegeProjectSummaryPatch=z.strictObject({
 title:z.string().trim().min(1).max(200),
 summary:z.string().trim().max(4000).nullable(),
 status:z.enum(["PLANNED","ACTIVE","COMPLETED"]),
 expectedTitle:z.string(),
 expectedSummary:z.string().nullable(),
 expectedStatus:z.enum(["PLANNED","ACTIVE","COMPLETED"]),
});
export function collegeProjectStatusChangeAllowed(from:string,to:string,hasMentor:boolean,approvedDelivery:boolean){
 if(from===to)return true;
 if(from==="PLANNED"&&to==="ACTIVE")return hasMentor;
 if(from==="ACTIVE"&&to==="COMPLETED")return approvedDelivery;
 return false;
}
