import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {independentAuditImporterReady,syncIndependentAuditInbox} from
 "@/modules/bug-tracker/independent-audit-inbox-importer";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;

/**
 * The external five-minute Cloud Scheduler intentionally calls GET; it has
 * no browser identity and must use a separately provisioned machine secret.
 * Never allow a configured short/whitespace secret or a caller-selected job.
 */
function authorized(request:Request){
 const secret=process.env["AUDIT_FINDINGS_CRON_SECRET"]??"";
 const raw=request.headers.get("authorization");
 if(!secret||!raw||Buffer.byteLength(secret,"utf8")<32||
    Buffer.byteLength(secret,"utf8")>256||secret!==secret.trim()||
    /\\s/u.test(secret)||!raw.startsWith("Bearer ")||raw.length>1024)
  return false;
 const bearer=raw.slice("Bearer ".length);
 if(!bearer||bearer!==bearer.trim()||/\\s/u.test(bearer))return false;
 const supplied=Buffer.from(bearer,"utf8");
 const expected=Buffer.from(secret,"utf8");
 return expected.byteLength===supplied.byteLength&&
  timingSafeEqual(expected,supplied);
}

/** Intended for the dedicated Cloud Scheduler worker, not a browser, cookie,
 * query-string token or caller-controlled repository/path. The importer holds
 * an exclusive PostgreSQL lease for up to 230 seconds.
 */
export async function GET(request:Request){
 if(request.headers.has("origin")||!authorized(request))
  return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStore});
 if(new URL(request.url).search)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
 // Reject a streamed GET body as well as a forged Content-Length: 0.
 // A valid scheduler request does not provide any payload.
 const body=await readBoundedUtf8Body(request,0);
 if(body.kind!=="OK"||body.body!=="")
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
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
