import {z} from "zod";

const resultRow=z.strictObject({
 row:z.number().int().min(1).max(500),
 name:z.string().max(300),
 status:z.enum(["CREATED","FAILED","SKIPPED","PARTIAL"]),
 message:z.string().max(2000),
});
export const facultyBulkImportResponseSchema=z.strictObject({
 total:z.number().int().min(0).max(500),
 created:z.number().int().min(0).max(500),
 failed:z.number().int().min(0).max(500),
 skipped:z.number().int().min(0).max(500),
 partial:z.number().int().min(0).max(500),
 results:z.array(resultRow).max(500),
}).refine(value=>
 value.total===value.results.length&&
 value.created===value.results.filter(row=>row.status==="CREATED").length&&
 value.failed===value.results.filter(row=>row.status==="FAILED").length&&
 value.skipped===value.results.filter(row=>row.status==="SKIPPED").length&&
 value.partial===value.results.filter(row=>row.status==="PARTIAL").length,
 {message:"Inconsistent faculty import result totals"},
);

export function facultyBulkImportFailureMessage(status:number):string{
 if(status===401||status===403)
  return "Your administrator access changed. Refresh the selected college and try again.";
 if(status===413)
  return "The faculty file is too large. Choose a smaller CSV and retry.";
 if(status===409)
  return "Faculty records changed. Refresh the roster before retrying.";
 if(status===400||status===422)
  return "Check the faculty CSV fields and selected college before retrying.";
 return "Bulk onboarding could not be confirmed. Review the faculty roster before retrying.";
}
