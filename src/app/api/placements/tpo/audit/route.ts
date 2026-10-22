import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoAuditLog,tpoAuditQuerySchema} from "@/modules/placements/tpo-audit-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Only revalidate a bounded, already-authorized TPO audit page. This is a
 * private in-memory stale-while-revalidate read, not an audit writer/export.
 * Every GET rechecks the persisted TPO actor and current college. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const raw:Record<string,unknown>=Object.fromEntries(url.searchParams.entries());
  for(const key of ["f_about","f_event","f_who","f_when"]){
   if(url.searchParams.has(key))raw[key]=url.searchParams.getAll(key);
  }
  const query=tpoAuditQuerySchema.parse(raw);
  const context=await getCurrentRequestContext();
  const result=await getTpoAuditLog(context,query);
  return NextResponse.json({
   items:result.items,matchedCount:result.matchedCount,
   page:result.page,pageSize:result.pageSize,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
