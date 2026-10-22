import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { importFacultyCsv } from "@/modules/people/faculty-bulk-import-service";
import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getDb } from "@/db/client";
import { users,departments } from "@/db/schema";
import { and,eq,inArray,isNull,or } from "drizzle-orm";
import { z } from "zod";

const previewSchema=z.object({
  collegeId:z.string().uuid(),
  csv:z.string().min(1).max(1_500_000),
  departmentId:z.string().uuid(),
  preview:z.literal(true),
}).strict();
export const runtime="nodejs";
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    // CSV can be 1.5 MB of text; cap the actual incoming JSON stream
    // before opening the selected-college identity and onboarding flow.
    const command=await readBoundedJsonRequest(request,4_000_000);
    if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const context=await getCurrentRequestContext();
    // A preview is always server-validated and performs no onboarding writes.
    // The subsequent confirmed import rechecks permissions and identities.
    if(command.value && typeof command.value==="object" &&
       "preview" in command.value && command.value.preview===true){
      const input=previewSchema.parse(command.value);
      const acting=await resolveActingCollege(context,"people.manage");
      if(acting.collegeId!==input.collegeId)throw new AuthorizationError("people.manage");
      const rows=parseFacultyBulkCsv(input.csv);
      const options=await getDb().select({id:departments.id,name:departments.name})
        .from(departments).where(and(eq(departments.collegeId,input.collegeId),
          isNull(departments.archivedAt))).limit(1001);
      if(options.length>1000)return Response.json({error:"TOO_MANY_DEPARTMENTS"},{status:409});
      if(!options.some(item=>item.id===input.departmentId))
        return Response.json({error:"DEPARTMENT_UNAVAILABLE"},{status:409});
      const departmentsByName=new Map<string,string|null>();
      for(const item of options){
        const key=item.name.trim().toLowerCase();
        departmentsByName.set(key,departmentsByName.has(key)?null:item.id);
      }
      const phones=rows.map(row=>row.phoneE164);
      const emails=rows.flatMap(row=>row.email?[row.email]:[]);
      const matches=await getDb().select({
        phone:users.phoneE164,email:users.email,
      }).from(users).where(or(
        inArray(users.phoneE164,phones),
        emails.length?inArray(users.email,emails):undefined,
      ));
      const seenPhone=new Set(matches.map(row=>row.phone));
      const seenEmail=new Set(matches.map(row=>row.email).filter((x):x is string=>Boolean(x)));
      const results=rows.map((row,index)=>{
        const validDepartment=!row.departmentName||
          Boolean(departmentsByName.get(row.departmentName.trim().toLowerCase()));
        const collision=seenPhone.has(row.phoneE164)||
          Boolean(row.email&&seenEmail.has(row.email));
        return {row:index+2,name:(row.firstName+" "+row.lastName).trim(),
          status:!validDepartment?"INVALID_DEPARTMENT" as const:
            collision?"REVIEW_EXISTING_IDENTITY" as const:"READY" as const,
          message:!validDepartment
            ?"Department must match exactly one active department in this college."
            :collision?"A matching identity exists. Review the college membership before importing."
            :"Validated; ready for confirmation."};
      });
      return Response.json({preview:true,total:rows.length,
        ready:results.filter(row=>row.status==="READY").length,
        needsReview:results.filter(row=>row.status!=="READY").length,
        results},{headers:{"Cache-Control":"private, no-store"}});
    }
    return Response.json(await importFacultyCsv(context,command.value),
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
