import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {independentAuditImporterReady,syncIndependentAuditInbox} from
 "@/modules/bug-tracker/independent-audit-inbox-importer";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
function authorized(request:Request){
 const secret=process.env.AUDIT_FINDINGS_CRON_SECRET?.trim();
 const raw=request.headers.get("authorization");
 if(!secret||!raw?.startsWith("Bearer "))return false;
 const supplied=Buffer.from(raw.slice(7),"utf8");
 const expected=Buffer.from(secret,"utf8");
 return expected.byteLength===supplied.byteLength&&
  timingSafeEqual(expected,supplied);
}
/** Intended for a five-minute GCP Cloud Scheduler job. No browser session,
 * cookies, query-string credentials or caller-supplied repository/path. The
 * importer holds an exclusive PostgreSQL lease for up to 230 seconds. */
export async function GET(request:Request){
 if(!authorized(request))
  return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStore});
 if(!independentAuditImporterReady())
  return NextResponse.json({error:"IMPORTER_NOT_READY"},{status:503,headers:noStore});
 try{
  const report=await syncIndependentAuditInbox();
  return NextResponse.json({result:report},{status:report.busy?409:200,headers:noStore});
 }catch{
  // Scheduled response must never return credentials, source data or DB traces.
  return NextResponse.json({error:"IMPORT_FAILED"},{status:500,headers:noStore});
 }
}
