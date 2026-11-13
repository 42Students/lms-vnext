import {NextResponse} from "next/server";
import {auditCronRequestRejection} from
 "@/modules/bug-tracker/audit-cron-request-guard";
import {independentAuditImporterReady,syncIndependentAuditInbox} from
 "@/modules/bug-tracker/independent-audit-inbox-importer";
import { route } from "@/security/route";

import { env } from "@/config/env";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.PRIVATE} as const;

/**
 * Dedicated Cloud Scheduler entrypoint. Retain the existing GET contract,
 * but reject any browser-origin call, weak/mismatched deployment secret,
 * caller-supplied query, or unexpected HTTP request body before DB/provider I/O.
 * No user cookie, tenant selector, or URL credential grants machine authority.
 */
async function handleGET(request:Request){
 const rejection=auditCronRequestRejection(
  request,env.AUDIT_FINDINGS_CRON_SECRET);
 if(rejection)
  return NextResponse.json({error:rejection},{
   status:rejection==="UNAUTHORIZED"?401:400,headers:noStore});
 if(!independentAuditImporterReady())
  return NextResponse.json({error:"IMPORTER_NOT_READY"},{status:503,headers:noStore});
 try{
  const report=await syncIndependentAuditInbox({kind:"SCHEDULER"});
  return NextResponse.json({result:report},{status:report.busy?409:200,headers:noStore});
 }catch{
  // Do not return GitHub source rows, credentials or database diagnostics.
  return NextResponse.json({error:"IMPORT_FAILED"},{status:500,headers:noStore});
 }
}
export const GET = route(
  { auth: "public", publicReason: "Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", csrf: false, csrfExemptReason: "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
