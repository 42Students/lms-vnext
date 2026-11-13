import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {bulkImportColleges} from "@/modules/colleges/bulk-import-service";
import { route } from "@/security/route";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const parsed=await readBoundedJsonRequest(request,16384);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const result=await bulkImportColleges(await getCurrentRequestContext(),parsed.value);
  return privateJson(result);
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
