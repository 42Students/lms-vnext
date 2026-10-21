import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseIndependentFindingFilters} from "@/modules/bug-tracker/independent-audit-findings-model";
import {listIndependentAuditFindings} from "@/modules/bug-tracker/independent-audit-findings-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only authenticated replacement for the legacy findings-list GET API.
 * Filtering and permission checks run in the same domain service as the board.
 * Credentials, syncing and mutations are never exposed by this endpoint.
 */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const raw:Record<string,string|string[]|undefined>={};
  for(const key of new Set(params.keys())){
   const values=params.getAll(key);
   raw[key]=values.length===1?values[0]:values;
  }
  const parsed=parseIndependentFindingFilters(raw);
  if(!parsed)return NextResponse.json({error:"INVALID_FILTERS"},{status:400,headers:{"Cache-Control":"private, no-store"}});
  const result=await listIndependentAuditFindings(await getCurrentRequestContext(),parsed);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
