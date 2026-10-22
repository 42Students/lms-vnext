import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listAdminDepartmentsAcrossColleges} from "@/modules/admin-ui/super-admin-department-directory-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const decimal=z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int());
const querySchema=z.strictObject({
 page:decimal.optional(),
 pageSize:decimal.optional(),
});
/** Selected admin scope is taken exclusively from the server-side session.
 * Request parameters cannot broaden organization or college access. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const params=Object.fromEntries(url.searchParams.entries());
  if([...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length!==1))
   return NextResponse.json({error:"INVALID_DIRECTORY_QUERY"},{status:400});
  const query=querySchema.parse(params);
  const directory=await listAdminDepartmentsAcrossColleges(
   await getCurrentRequestContext(),query);
  return NextResponse.json(directory,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof z.ZodError)
   return NextResponse.json({error:"INVALID_DIRECTORY_QUERY"},{status:400,
    headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}
