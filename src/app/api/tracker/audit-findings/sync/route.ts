import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {readIndependentFindingSyncState} from "@/modules/bug-tracker/independent-audit-findings-service";
import {
 independentAuditImporterReady,syncIndependentAuditInbox,
} from "@/modules/bug-tracker/independent-audit-inbox-importer";
import {independentAuditGithubConfigured} from "@/modules/bug-tracker/independent-audit-github-client";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.PRIVATE} as const;

async function authorizedContext(){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
   context.adminScope?.organizationId||context.adminScope?.collegeId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 return context;
}

/** Legacy GET /sync returns real stored provenance only, not an inferred
 * success based on GitHub having a nonempty inbox. */
async function handleGET(){
 try{
  const context=await authorizedContext();
  const state=await readIndependentFindingSyncState(context);
  return NextResponse.json({
   source:"42Students/lms-findings",configured:independentAuditGithubConfigured(),
   importReady:independentAuditImporterReady(),state,
  },{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  () => handleGET(),
);

/** Manual Sync now must satisfy origin, active unscoped Super Admin,
 * a fresh device session and a persisted grant locked for the real write. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 // No caller-supplied tenant/repository/options may affect the sync.
 if(new URL(request.url).search)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 // A forged Content-Length: 0 is not proof of an empty streamed body;
 // reject both inconsistent metadata and actual bytes.
 const length=request.headers.get("content-length");
 if((length!==null&&length!=="0")||request.headers.has("transfer-encoding"))
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 const body=await readBoundedUtf8Body(request,0);
 if(body.kind!=="OK"||body.body!=="")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 try{
  const context=await authorizedContext();
  await requireRecentDeviceAuthentication(context.user.id);
  if(!independentAuditImporterReady())
   return NextResponse.json({error:"IMPORTER_NOT_READY",message:
    "GitHub credentials and the durable audit file ledger must be verified before importing."},
    {status:503,headers:noStore});
  const result=await syncIndependentAuditInbox({kind:"SUPER_ADMIN",actor:context});
  return NextResponse.json({result},{status:result.busy?409:200,headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
