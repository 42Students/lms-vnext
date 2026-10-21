import {NextResponse} from "next/server";
import {and,asc,eq,ilike,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {departments} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {z} from "zod";

export const runtime="nodejs";
/** Modern scoped equivalent of legacy GET department search. Non-global
 * callers must have a persisted active college or supply that same college;
 * a missing scope is a structured 403, never a global search.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const params=new URL(request.url).searchParams;
  if([...params.keys()].some(key=>!["q","collegeId"].includes(key))||
     [...params.keys()].some(key=>params.getAll(key).length!==1))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const parsed=z.object({
   q:z.string().trim().max(120),
   collegeId:z.string().uuid().optional(),
  }).safeParse({q:params.get("q")??"",collegeId:params.get("collegeId")??undefined});
  if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const given=parsed.data.collegeId;
  const memberCollege=context.membership?.status==="ACTIVE"?context.membership.collegeId:null;
  if(!isSuperAdmin(context)&&(!memberCollege || (given&&given!==memberCollege)))
   return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED",
    message:"College ID is required to search departments for this account."},{status:403});
  const collegeId=given??context.adminScope?.collegeId??memberCollege;
  if(!collegeId)return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED",
   message:"Select a college before searching departments."},{status:403});
  requirePermission(context,"academics.read",{collegeId});
  const term=parsed.data.q.replace(/[%_\\]/g,"\\$&");
  const rows=await getDb().select({id:departments.id,name:departments.name})
   .from(departments).where(and(eq(departments.collegeId,collegeId),
    isNull(departments.archivedAt),ilike(departments.name,"%"+term+"%")))
   .orderBy(asc(departments.name),asc(departments.id)).limit(15);
  return NextResponse.json({items:rows},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
