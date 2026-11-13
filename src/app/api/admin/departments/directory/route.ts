import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listAdminDepartmentsAcrossColleges} from "@/modules/admin-ui/super-admin-department-directory-service";
import { route } from "@/security/route";

import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const decimal=z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int());
const querySchema=z.strictObject({
 page:decimal.optional(),
 pageSize:decimal.optional(),
});
/** Selected admin scope is taken exclusively from the server-side session.
 * Request parameters cannot broaden organization or college access. */
async function handleGET(request:Request){
 try{
  const url=new URL(request.url);
  const params=Object.fromEntries(url.searchParams.entries());
  if([...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length!==1))
   return NextResponse.json({error:"INVALID_DIRECTORY_QUERY"},{status:400});
  const query=querySchema.parse(params);
  const directory=await listAdminDepartmentsAcrossColleges(
   await getCurrentRequestContext(),query);
  return privateJson(directory);
 }catch(error){
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_DIRECTORY_QUERY"},{status:400,
    headers:{"Cache-Control":CACHE.PRIVATE}});
  return apiErrorResponse(error);
 }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
