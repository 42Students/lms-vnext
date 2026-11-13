import {NextResponse} from "next/server";
import {readBoundedUtf8Body} from "@/lib/request-body";
import {scannerCallbackRequestRejection} from "@/modules/storage/scan-verdict-request-guard";
import {
 applyProductionScanVerdict,productionScannerCallbackReady,
} from "@/modules/storage/production-scan-verdict-service";
import { route } from "@/security/route";

import { env } from "@/config/env";
import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.NONE} as const;

/**
 * Restricted service-to-service callback. Only a deployed, vetted malware
 * scanner may possess the long independent webhook secret. It must scan all
 * bytes of the private R2 object, compute a digest, and supply the previously
 * captured object generation. Never expose this endpoint as a user action.
 */
async function handlePOST(request:Request){
  // One machine-only gate, evaluated before parsing, scanning or database I/O.
  const rejection=scannerCallbackRequestRejection(
   request,env.PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET);
  if(rejection==="INVALID_ORIGIN")
   return NextResponse.json({error:rejection},{status:403,headers:noStore});
  if(!productionScannerCallbackReady())
   return NextResponse.json({error:"SCANNER_NOT_READY"},{status:503,headers:noStore});
  if(rejection==="FORBIDDEN")
   return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
  if(rejection)
   return NextResponse.json({error:"INVALID_SCAN_VERDICT"},{status:400,headers:noStore});
 const payload=await readBoundedUtf8Body(request,2048);
 if(payload.kind!=="OK"){
  return NextResponse.json({error:"INVALID_SCAN_VERDICT"},{status:400,headers:noStore});
 }
 let input:unknown;
 try{input=JSON.parse(payload.body);}
 catch{return NextResponse.json({error:"INVALID_SCAN_VERDICT"},{status:400,headers:noStore});}
 try{
  const result=await applyProductionScanVerdict(input);
  return NextResponse.json(result,{headers:noStore});
 }catch{
  // Neither object keys nor request bodies, scanner credentials, file titles,
  // SHA-256 digests or raw database errors may appear in provider-visible logs.
  return NextResponse.json({error:"SCAN_VERDICT_NOT_ACCEPTED"},
   {status:409,headers:noStore});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", csrf: false, csrfExemptReason: "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead.", rateLimit: RATE_LIMITS.BULK },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
