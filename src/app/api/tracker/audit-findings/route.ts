
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseIndependentFindingFilters} from "@/modules/bug-tracker/independent-audit-findings-model";
import {listIndependentAuditFindings} from "@/modules/bug-tracker/independent-audit-findings-service";
import { route } from "@/security/route";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only authenticated replacement for the legacy findings-list GET API.
 * Filtering and permission checks run in the same domain service as the board.
 * Credentials, syncing and mutations are never exposed by this endpoint.
 */
async function handleGET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const raw:Record<string,string|string[]|undefined>={};
  for(const key of new Set(params.keys())){
   const values=params.getAll(key);
   raw[key]=values.length===1?values[0]:values;
  }
  const parsed=parseIndependentFindingFilters(raw);
  if(!parsed)return privateJson({error:"INVALID_FILTERS"}, { status: 400 });
  const result=await listIndependentAuditFindings(await getCurrentRequestContext(),parsed);
  return privateJson(result);
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
