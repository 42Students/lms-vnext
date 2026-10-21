import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getDb} from "@/db/client";
import {readIndependentFindingSyncState} from "@/modules/bug-tracker/independent-audit-findings-service";
import {
 independentAuditImporterReady,syncIndependentAuditInbox,
} from "@/modules/bug-tracker/independent-audit-inbox-importer";
import {independentAuditGithubConfigured} from "@/modules/bug-tracker/independent-audit-github-client";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;

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
export async function GET(){
 try{
  const context=await authorizedContext();
  const state=await readIndependentFindingSyncState(context);
  return NextResponse.json({
   source:"42Students/lms-findings",configured:independentAuditGithubConfigured(),
   importReady:independentAuditImporterReady(),state,
  },{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}

/** Manual Sync now must satisfy origin, active unscoped Super Admin,
 * platform permission, persisted principal and the verified ledger gate. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const context=await authorizedContext();
  if(!independentAuditImporterReady())
   return NextResponse.json({error:"IMPORTER_NOT_READY",message:
    "GitHub credentials and the durable audit file ledger must be verified before importing."},
    {status:503,headers:noStore});
  await getDb().transaction(async tx=>{
   await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  });
  const result=await syncIndependentAuditInbox();
  return NextResponse.json({result},{status:result.busy?409:200,headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
