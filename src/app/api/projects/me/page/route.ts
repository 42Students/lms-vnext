import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listMyProjectInstancesLegacyPage} from "@/modules/projects/member-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Legacy-compatible, read-only zero-based learner project pagination.
 * The native /learn/projects page remains the primary vNext role workspace.
 */
const querySchema=z.strictObject({
 page:z.coerce.number().int().min(0).max(99999).default(0),
 size:z.coerce.number().int().refine(v=>v===10||v===25||v===50).default(25),
 search:z.string().trim().max(100).optional(),
 status:z.enum(["CURRENT","PLANNED","ACTIVE","COMPLETED","ARCHIVED",
  "IN_PROGRESS","READY","BLOCKED"]).optional(),
 attention:z.enum(["LEARNER_ACTION","BLOCKED"]).optional(),
});
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const keys=["page","size","search","status","attention"];
  if([...url.searchParams.keys()].some(key=>!keys.includes(key))||
     keys.some(key=>url.searchParams.getAll(key).length>1)){
    return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  }
  const query=querySchema.parse(Object.fromEntries(url.searchParams));
  const page=await listMyProjectInstancesLegacyPage(
   await getCurrentRequestContext(),{
    page0:query.page,size:query.size as 10|25|50,
    ...(query.search !== undefined ? {search:query.search} : {}),
    ...(query.status !== undefined ? {status:query.status} : {}),
    ...(query.attention !== undefined ? {attention:query.attention} : {}),
   });
  return NextResponse.json(page,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
