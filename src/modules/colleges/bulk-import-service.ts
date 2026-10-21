import "server-only";
import {inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {createCollege,CollegeServiceError} from "./service";
import {collegeImportInputSchema,parseCollegeImportCsv} from "./bulk-import-model";
export async function bulkImportColleges(ctx:RequestContext,raw:unknown){
 const {organizationId,csv}=collegeImportInputSchema.parse(raw);
 requirePermission(ctx,"college.manage",{organizationId});
 const rows=parseCollegeImportCsv(csv,organizationId);
 const present=rows.length?await getDb().select({code:colleges.code}).from(colleges)
  .where(inArray(sql<string>`lower(${colleges.code})`,rows.map(r=>r.code.toLowerCase()))):[];
 const taken=new Set(present.map(r=>r.code.toLowerCase()));
 const results:{line:number;code:string;status:"CREATED"|"SKIPPED"|"FAILED";message:string}[]=[];
 for(const row of rows){
  if(taken.has(row.code.toLowerCase())){
   results.push({line:row.line,code:row.code,status:"SKIPPED",message:"College code already exists."});continue;
  }
  try{
   const created=await createCollege(ctx,{organizationId,name:row.name,code:row.code,
    city:row.city,state:row.state,country:row.country});
   results.push({line:row.line,code:created.code,status:"CREATED",message:"College created."});
  }catch(error){
   const isDuplicate=error instanceof CollegeServiceError&&error.code==="COLLEGE_CODE_CONFLICT";
   results.push({line:row.line,code:row.code,status:isDuplicate?"SKIPPED":"FAILED",
    message:isDuplicate?"College code already exists.":"College could not be created."});
  }
 }
 return {results,created:results.filter(x=>x.status==="CREATED").length,
  skipped:results.filter(x=>x.status==="SKIPPED").length,
  failed:results.filter(x=>x.status==="FAILED").length};
}
